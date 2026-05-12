import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { getPrisma } from './lib/prisma';
import { logger } from './lib/logger';

// 1. Environment Validation
const REQUIRED_ENV = ['DATABASE_URL', 'RESEND_API_KEY', 'FRONTEND_URL', 'EMAIL_FROM'] as const;
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = createApp();

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Plunt backend listening on port ${PORT}`);
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(async () => {
    try {
      await getPrisma().$disconnect();
      logger.info('Prisma disconnected');
    } catch (err) {
      logger.error({ err }, 'Prisma disconnect error');
    }
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced exit after 10s shutdown timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
