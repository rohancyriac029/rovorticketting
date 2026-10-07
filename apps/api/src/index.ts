import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(() => {
    logger.info('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
