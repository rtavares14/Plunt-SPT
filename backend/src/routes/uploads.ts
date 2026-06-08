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
  plant: process.env.CLOUDINARY_USERS_PLANTS_FOLDER,
  planter: process.env.CLOUDINARY_USERS_PLANTERS_FOLDER,
  avatar: process.env.CLOUDINARY_USERS_AVATARS_FOLDER,
  banner: process.env.CLOUDINARY_USERS_BANNERS_FOLDER,
};

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';

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
      res.status(400).json({ error: "kind must be 'plant', 'planter', 'avatar', or 'banner'" });
      return;
    }

    configure();

    // Sign every parameter the client will submit. Cloudinary excludes
    // `file`, `cloud_name`, `resource_type`, and `api_key` from signing — so
    // additionally pin `resource_type=image` in the request URL on the
    // client to prevent the same signature being reused against `raw/upload`.
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder,
      timestamp,
      allowed_formats: ALLOWED_FORMATS,
      unique_filename: 'true',
      overwrite: 'false',
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      allowedFormats: ALLOWED_FORMATS,
      uniqueFilename: 'true',
      overwrite: 'false',
    });
  } catch (err) {
    req.log.error({ err }, 'Cloudinary signature error');
    res.status(500).json({ error: 'Could not sign upload' });
  }
});

export default router;
