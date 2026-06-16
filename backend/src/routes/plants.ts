import { Router, Request, Response } from 'express';
import { getPrisma } from '../lib/prisma';
import { authMiddleware, requireVerified } from '../middleware/auth';
import { Sunlight } from '../generated/prisma/client';
import {
  INVALID,
  optionalDate,
  optionalNumber,
  optionalString,
  optionalUrl,
  trimmedString,
} from '../lib/validate';
import { isKnownCity } from '../lib/geocoding';

const router = Router();

router.use(authMiddleware, requireVerified);

const SUNLIGHT_VALUES: Sunlight[] = [Sunlight.HIGH, Sunlight.MEDIUM, Sunlight.LOW];

/**
 * Confirms a non-empty city is a real place per the geocoder, mirroring the
 * frontend's CityAutocomplete. Skipped under test to keep the suite offline and
 * deterministic. Fails open on geocoder outage so a third-party hiccup can't
 * block plant creation (the UI has already validated by this point).
 */
async function cityIsAcceptable(city: string, req: Request): Promise<boolean> {
  if (process.env.NODE_ENV === 'test') return true;
  try {
    return await isKnownCity(city);
  } catch {
    req.log.warn('City geocoding check skipped: geocoder unavailable');
    return true;
  }
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
    const name = trimmedString(req.body?.name, 50);
    if (!name) {
      res.status(400).json({ error: 'Name is required (max 50 characters)' });
      return;
    }

    const species = optionalString(req.body?.species, 70);
    if (species === INVALID) {
      res.status(400).json({ error: 'Species is invalid' });
      return;
    }

    const notes = optionalString(req.body?.notes, 200);
    if (notes === INVALID) {
      res.status(400).json({ error: 'Notes are invalid' });
      return;
    }

    const city = optionalString(req.body?.city, 100);
    if (city === INVALID) {
      res.status(400).json({ error: 'City is invalid' });
      return;
    }
    if (city && !(await cityIsAcceptable(city, req))) {
      res.status(400).json({ error: 'Pick a real city from the suggestions' });
      return;
    }

    const wateringIntervalDays = optionalNumber(req.body?.wateringIntervalDays, 1, 365);
    if (wateringIntervalDays === INVALID) {
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
    if (minTemp === INVALID || maxTemp === INVALID) {
      res.status(400).json({ error: 'Temperature must be between -50°C and 60°C' });
      return;
    }
    if (minTemp != null && maxTemp != null && minTemp > maxTemp) {
      res.status(400).json({ error: 'minTemp cannot be greater than maxTemp' });
      return;
    }

    const lastWateredAt = optionalDate(req.body?.lastWateredAt);
    const dateAcquired = optionalDate(req.body?.dateAcquired);
    if (lastWateredAt === INVALID || dateAcquired === INVALID) {
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
    if (imageUrl === INVALID) {
      res.status(400).json({ error: 'imageUrl must be a valid http(s) URL' });
      return;
    }

    const plant = await getPrisma().plant.create({
      data: {
        ownerId: req.user!.userId,
        planterId: planterId ?? null,
        name,
        species: species ?? null,
        notes: notes ?? null,
        city: city ?? null,
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

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    // Load current temp range so we can validate the merged state, not just
    // the fields the caller happened to send.
    const existing = await getPrisma().plant.findFirst({
      where: { id, ownerId: req.user!.userId },
      select: { id: true, minTemp: true, maxTemp: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }

    const data: Record<string, unknown> = {};

    if (req.body?.name !== undefined) {
      const name = trimmedString(req.body.name, 50);
      if (!name) {
        res.status(400).json({ error: 'Name is required (max 50 characters)' });
        return;
      }
      data.name = name;
    }

    if (req.body?.species !== undefined) {
      const species = optionalString(req.body.species, 70);
      if (species === INVALID) {
        res.status(400).json({ error: 'Species is invalid' });
        return;
      }
      data.species = species;
    }

    if (req.body?.notes !== undefined) {
      const notes = optionalString(req.body.notes, 200);
      if (notes === INVALID) {
        res.status(400).json({ error: 'Notes are invalid' });
        return;
      }
      data.notes = notes;
    }

    if (req.body?.city !== undefined) {
      const city = optionalString(req.body.city, 100);
      if (city === INVALID) {
        res.status(400).json({ error: 'City is invalid' });
        return;
      }
      if (city && !(await cityIsAcceptable(city, req))) {
        res.status(400).json({ error: 'Pick a real city from the suggestions' });
        return;
      }
      data.city = city;
    }

    if (req.body?.wateringIntervalDays !== undefined) {
      const wateringIntervalDays = optionalNumber(req.body.wateringIntervalDays, 1, 365);
      if (wateringIntervalDays === INVALID || wateringIntervalDays === null) {
        res.status(400).json({ error: 'wateringIntervalDays must be between 1 and 365' });
        return;
      }
      data.wateringIntervalDays = wateringIntervalDays;
    }

    if (req.body?.sunlight !== undefined) {
      if (!SUNLIGHT_VALUES.includes(req.body.sunlight as Sunlight)) {
        res.status(400).json({ error: 'sunlight must be HIGH, MEDIUM, or LOW' });
        return;
      }
      data.sunlight = req.body.sunlight as Sunlight;
    }

    let mergedMin: number | null = existing.minTemp;
    let mergedMax: number | null = existing.maxTemp;
    if (req.body?.minTemp !== undefined) {
      const next = optionalNumber(req.body.minTemp, -50, 60);
      if (next === INVALID) {
        res.status(400).json({ error: 'Temperature must be between -50°C and 60°C' });
        return;
      }
      data.minTemp = next;
      mergedMin = next ?? null;
    }
    if (req.body?.maxTemp !== undefined) {
      const next = optionalNumber(req.body.maxTemp, -50, 60);
      if (next === INVALID) {
        res.status(400).json({ error: 'Temperature must be between -50°C and 60°C' });
        return;
      }
      data.maxTemp = next;
      mergedMax = next ?? null;
    }
    if (mergedMin != null && mergedMax != null && mergedMin > mergedMax) {
      res.status(400).json({ error: 'minTemp cannot be greater than maxTemp' });
      return;
    }

    if (req.body?.lastWateredAt !== undefined) {
      const lastWateredAt = optionalDate(req.body.lastWateredAt);
      if (lastWateredAt === INVALID) {
        res.status(400).json({ error: 'Invalid date' });
        return;
      }
      data.lastWateredAt = lastWateredAt;
    }
    if (req.body?.dateAcquired !== undefined) {
      const dateAcquired = optionalDate(req.body.dateAcquired);
      if (dateAcquired === INVALID || dateAcquired === null) {
        res.status(400).json({ error: 'Invalid date' });
        return;
      }
      data.dateAcquired = dateAcquired;
    }

    if (req.body?.planterId !== undefined) {
      const planterId = req.body.planterId;
      if (planterId === null) {
        data.planterId = null;
      } else {
        if (typeof planterId !== 'string' || !planterId) {
          res.status(400).json({ error: 'Invalid planterId' });
          return;
        }
        const ownedPlanter = await getPrisma().planter.findFirst({
          where: { id: planterId, ownerId: req.user!.userId },
          select: { id: true },
        });
        if (!ownedPlanter) {
          res.status(400).json({ error: 'Planter not found' });
          return;
        }
        data.planterId = planterId;
      }
    }

    if (req.body?.imageUrl !== undefined) {
      const imageUrl = optionalUrl(req.body.imageUrl);
      if (imageUrl === INVALID) {
        res.status(400).json({ error: 'imageUrl must be a valid http(s) URL' });
        return;
      }
      if (imageUrl) {
        await getPrisma().plantImage.create({ data: { plantId: id, url: imageUrl } });
      }
    }

    const plant = await getPrisma().plant.update({
      where: { id },
      data,
      include: {
        planter: { select: { id: true, name: true, isIndoor: true } },
        images: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.json({ plant });
  } catch (err) {
    req.log.error({ err }, 'Update plant error');
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
