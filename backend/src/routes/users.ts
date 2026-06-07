import { Router, Request, Response } from 'express';
import { getPrisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/me/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const prisma = getPrisma();
    const [plantCount, planterCount] = await Promise.all([
      prisma.plant.count({ where: { ownerId: userId } }),
      prisma.planter.count({ where: { ownerId: userId } }),
    ]);
    res.json({ plantCount, planterCount });
  } catch (err) {
    req.log.error({ err }, 'Get user stats error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
