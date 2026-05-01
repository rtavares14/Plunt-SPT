import { Router, Request, Response } from 'express';
import { getPrisma } from '../lib/prisma';
import { authMiddleware, requireVerified } from '../middleware/auth';
import { Sunlight } from '../generated/prisma/client';

const router = Router();

router.use(authMiddleware, requireVerified);

const SUNLIGHT_VALUES: Sunlight[] = [Sunlight.HIGH, Sunlight.MEDIUM, Sunlight.LOW];

function trimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t || t.length > max) return null;
  return t;
}

function optionalString(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  if (!t) return null;
  if (t.length > max) return undefined;
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

function optionalNumber(value: unknown, min: number, max: number): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const plants = await getPrisma().plant.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        planter: { select: { id: true, name: true, isIndoor: true } },
        images: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.json({ plants });
  } catch (err) {
    req.log.error({ err }, 'List plants error');
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

    const species = optionalString(req.body?.species, 120);
    if (species === undefined) {
      res.status(400).json({ error: 'Species is invalid' });
      return;
    }

    const wateringIntervalDays = optionalNumber(req.body?.wateringIntervalDays, 1, 365);
    if (wateringIntervalDays === undefined) {
      res.status(400).json({ error: 'wateringIntervalDays must be between 1 and 365' });
      return;
    }

    const sunlightValue = req.body?.sunlight;
    if (
      sunlightValue !== undefined &&
      !SUNLIGHT_VALUES.includes(sunlightValue as Sunlight)
    ) {
      res.status(400).json({ error: 'sunlight must be HIGH, MEDIUM, or LOW' });
      return;
    }

    const minTemp = optionalNumber(req.body?.minTemp, -50, 60);
    const maxTemp = optionalNumber(req.body?.maxTemp, -50, 60);
    if (minTemp === undefined || maxTemp === undefined) {
      res.status(400).json({ error: 'Temperature must be between -50°C and 60°C' });
      return;
    }
    if (minTemp != null && maxTemp != null && minTemp > maxTemp) {
      res.status(400).json({ error: 'minTemp cannot be greater than maxTemp' });
      return;
    }

    const lastWateredAt = optionalDate(req.body?.lastWateredAt);
    const dateAcquired = optionalDate(req.body?.dateAcquired);
    if (lastWateredAt === undefined || dateAcquired === undefined) {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }

    const planterId = req.body?.planterId;
    if (planterId !== undefined && planterId !== null) {
      if (typeof planterId !== 'string' || !planterId) {
        res.status(400).json({ error: 'Invalid planterId' });
        return;
      }
      const owned = await getPrisma().planter.findFirst({
        where: { id: planterId, ownerId: req.user!.userId },
        select: { id: true },
      });
      if (!owned) {
        res.status(400).json({ error: 'Planter not found' });
        return;
      }
    }

    // Optional first image attached at creation time.
    const imageUrl = optionalUrl(req.body?.imageUrl);
    if (imageUrl === undefined) {
      res.status(400).json({ error: 'imageUrl must be a valid http(s) URL' });
      return;
    }

    const plant = await getPrisma().plant.create({
      data: {
        ownerId: req.user!.userId,
        planterId: planterId ?? null,
        name,
        species: species ?? null,
        wateringIntervalDays: wateringIntervalDays ?? 7,
        sunlight: (sunlightValue as Sunlight | undefined) ?? Sunlight.MEDIUM,
        minTemp: minTemp ?? null,
        maxTemp: maxTemp ?? null,
        lastWateredAt: lastWateredAt ?? null,
        dateAcquired: dateAcquired ?? new Date(),
        ...(imageUrl ? { images: { create: { url: imageUrl } } } : {}),
      },
      include: {
        planter: { select: { id: true, name: true, isIndoor: true } },
        images: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.status(201).json({ plant });
  } catch (err) {
    req.log.error({ err }, 'Create plant error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await getPrisma().plant.deleteMany({
      where: { id, ownerId: req.user!.userId },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, 'Delete plant error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
