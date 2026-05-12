import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/prisma/client';

import { Resend } from 'resend';

dotenv.config();

const REQUIRED_ENV = ['DATABASE_URL', 'RESEND_API_KEY', 'CORS_ORIGIN', 'EMAIL_FROM'] as const;
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Plunt API is running' });
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const waitlistLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many signups. Please try again in a minute.' },
});

app.post('/api/waitlist', waitlistLimiter, async (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const email = rawEmail.trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await prisma.waitlistEntry.create({ data: { email } });

    // Fire-and-forget: send confirmation email without blocking the response
    resend.emails
      .send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: "You're on the list!",
        text: `Hey,\n\nThanks for joining the waitlist for myPlunt! We're building a private space for you and your plants to thrive together.\n\nWe'll reach out when the beta opens and again on launch day. In the meantime, keep those plants happy!\n\n— Ricardo from Plunt`,
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <p>Hey,</p>
            <p>Thanks for joining the waitlist for myPlunt! We're building a private space for you and your plants to thrive together.</p>
            <p>We'll reach out when the beta opens and again on launch day. In the meantime, keep those plants happy!</p>
            <p>Plunt</p>
          </div>
        `,
        headers: {
          'X-Entity-Ref-ID': Date.now().toString(),
        },
      })
      .catch((emailErr) => console.error('Failed to send confirmation email', emailErr));

    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(200).json({ ok: true, alreadyRegistered: true });
    }
    console.error('waitlist signup failed', err);
    return res.status(500).json({ error: 'Could not save signup' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Plunt backend running on http://localhost:${PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
