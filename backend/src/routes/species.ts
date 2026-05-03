import { Router, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth';
import { searchSpecies, getSpeciesDetail, trefleConfigured } from '../lib/trefle';

const router = Router();

const speciesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? '', 56),
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many lookups, slow down a bit.' },
});

router.get('/search', authMiddleware, speciesLimiter, async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      res.json({ results: [], configured: trefleConfigured() });
      return;
    }
    const results = await searchSpecies(q);
    res.json({ results, configured: trefleConfigured() });
  } catch (err) {
    req.log.error({ err }, 'Species search error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, speciesLimiter, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid species id' });
      return;
    }
    const detail = await getSpeciesDetail(id);
    if (!detail) {
      res.status(404).json({ error: 'Species not found' });
      return;
    }
    res.json({ species: detail });
  } catch (err) {
    req.log.error({ err }, 'Species detail error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
