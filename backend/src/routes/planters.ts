import { Router, Request, Response } from 'express';
import { getPrisma } from '../lib/prisma';
import { authMiddleware, requireVerified } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, requireVerified);

function trimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t || t.length > max) return null;
  return t;
}

function optionalUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return t;
  } catch {
    return undefined;
  }
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const planters = await getPrisma().planter.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { plants: true } } },
    });
    res.json({ planters });
  } catch (err) {
    req.log.error({ err }, 'List planters error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const name = trimmedString(req.body?.name, 80);
    if (!name) {
      res.status(400).json({ error: 'Name is required (max 80 characters)' });
      return;
    }

    const description = req.body?.description === undefined
      ? null
      : trimmedString(req.body.description, 500);
    if (req.body?.description !== undefined && req.body.description !== '' && description === null) {
      res.status(400).json({ error: 'Description is too long (max 500 characters)' });
      return;
    }

    const isIndoor = typeof req.body?.isIndoor === 'boolean' ? req.body.isIndoor : true;

    const imageUrl = optionalUrl(req.body?.imageUrl);
    if (imageUrl === undefined) {
      res.status(400).json({ error: 'imageUrl must be a valid http(s) URL' });
      return;
    }

    const planter = await getPrisma().planter.create({
      data: {
        ownerId: req.user!.userId,
        name,
        description,
        isIndoor,
        imageUrl,
      },
    });
    res.status(201).json({ planter });
  } catch (err) {
    req.log.error({ err }, 'Create planter error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const owned = await getPrisma().planter.findFirst({
      where: { id, ownerId: req.user!.userId },
      select: { id: true },
    });
    if (!owned) {
      res.status(404).json({ error: 'Planter not found' });
      return;
    }

    const data: Record<string, unknown> = {};

    if (req.body?.name !== undefined) {
      const name = trimmedString(req.body.name, 80);
      if (!name) {
        res.status(400).json({ error: 'Name is required (max 80 characters)' });
        return;
      }
      data.name = name;
    }
    if (req.body?.description !== undefined) {
      data.description = req.body.description === null || req.body.description === ''
        ? null
        : trimmedString(req.body.description, 500);
      if (data.description === null && req.body.description && req.body.description !== '') {
        res.status(400).json({ error: 'Description is too long (max 500 characters)' });
        return;
      }
    }
    if (typeof req.body?.isIndoor === 'boolean') {
      data.isIndoor = req.body.isIndoor;
    }
    if (req.body?.imageUrl !== undefined) {
      const imageUrl = optionalUrl(req.body.imageUrl);
      if (imageUrl === undefined) {
        res.status(400).json({ error: 'imageUrl must be a valid http(s) URL' });
        return;
      }
      data.imageUrl = imageUrl;
    }

    const planter = await getPrisma().planter.update({
      where: { id },
      data,
    });
    res.json({ planter });
  } catch (err) {
    req.log.error({ err }, 'Update planter error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await getPrisma().planter.deleteMany({
      where: { id, ownerId: req.user!.userId },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Planter not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, 'Delete planter error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
