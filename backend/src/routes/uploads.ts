import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, requireVerified } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, requireVerified);

let configured = false;
function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

const FOLDERS: Record<string, string | undefined> = {
  plant: process.env.CLOUDINARY_PLANT_FOLDER,
  planter: process.env.CLOUDINARY_PLANTER_FOLDER,
};

router.post('/signature', (req: Request, res: Response) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({ error: 'Image uploads are not configured' });
      return;
    }

    const kind = String(req.body?.kind ?? '');
    const folder = FOLDERS[kind];
    if (!folder) {
      res.status(400).json({ error: "kind must be 'plant' or 'planter'" });
      return;
    }

    configure();

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      apiSecret,
    );

    res.json({ signature, timestamp, apiKey, cloudName, folder });
  } catch (err) {
    req.log.error({ err }, 'Cloudinary signature error');
    res.status(500).json({ error: 'Could not sign upload' });
  }
});

export default router;
