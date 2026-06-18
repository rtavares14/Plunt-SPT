import { Router, Request, Response } from 'express';
import { getPrisma } from '../lib/prisma';
import { authMiddleware, requireVerified } from '../middleware/auth';
import { NoteColor } from '../generated/prisma/client';
import { INVALID, optionalString, trimmedString } from '../lib/validate';

const router = Router();

router.use(authMiddleware, requireVerified);

const NOTE_COLORS: NoteColor[] = [
  NoteColor.YELLOW,
  NoteColor.PINK,
  NoteColor.BLUE,
  NoteColor.GREEN,
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const questions = await getPrisma().question.findMany({
      where: { authorId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ questions });
  } catch (err) {
    req.log.error({ err }, 'List questions error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = trimmedString(req.body?.body, 280);
    if (!body) {
      res.status(400).json({ error: 'A question is required (max 280 characters)' });
      return;
    }

    const title = optionalString(req.body?.title, 80);
    if (title === INVALID) {
      res.status(400).json({ error: 'Title is invalid' });
      return;
    }

    const colorValue = req.body?.color;
    if (colorValue !== undefined && !NOTE_COLORS.includes(colorValue as NoteColor)) {
      res.status(400).json({ error: 'color must be YELLOW, PINK, BLUE, or GREEN' });
      return;
    }

    const question = await getPrisma().question.create({
      data: {
        authorId: req.user!.userId,
        title: title ?? null,
        body,
        color: (colorValue as NoteColor | undefined) ?? NoteColor.YELLOW,
      },
    });
    res.status(201).json({ question });
  } catch (err) {
    req.log.error({ err }, 'Create question error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await getPrisma().question.findFirst({
      where: { id, authorId: req.user!.userId },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const data: Record<string, unknown> = {};

    if (req.body?.body !== undefined) {
      const body = trimmedString(req.body.body, 280);
      if (!body) {
        res.status(400).json({ error: 'A question is required (max 280 characters)' });
        return;
      }
      data.body = body;
    }

    if (req.body?.title !== undefined) {
      const title = optionalString(req.body.title, 80);
      if (title === INVALID) {
        res.status(400).json({ error: 'Title is invalid' });
        return;
      }
      data.title = title;
    }

    if (req.body?.color !== undefined) {
      if (!NOTE_COLORS.includes(req.body.color as NoteColor)) {
        res.status(400).json({ error: 'color must be YELLOW, PINK, BLUE, or GREEN' });
        return;
      }
      data.color = req.body.color as NoteColor;
    }

    if (req.body?.resolved !== undefined) {
      if (typeof req.body.resolved !== 'boolean') {
        res.status(400).json({ error: 'resolved must be a boolean' });
        return;
      }
      data.resolved = req.body.resolved;
    }

    const question = await getPrisma().question.update({ where: { id }, data });
    res.json({ question });
  } catch (err) {
    req.log.error({ err }, 'Update question error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await getPrisma().question.deleteMany({
      where: { id, authorId: req.user!.userId },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, 'Delete question error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
