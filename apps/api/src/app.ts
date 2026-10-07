import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { projectsRouter } from './routes/projects.js';
import { projectTicketsRouter, ticketsRouter } from './routes/tickets.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

export const app = express();

app.use(helmet());

const vercelPreviewPattern = env.VERCEL_PROJECT_NAME
  ? new RegExp(`^https://${env.VERCEL_PROJECT_NAME}-[a-z0-9-]+\\.vercel\\.app$`)
  : null;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      if (env.ALLOW_VERCEL_PREVIEWS && vercelPreviewPattern?.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(pinoHttp({ logger }));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', db: 'error' });
  }
});

app.use('/api/projects', projectsRouter);
app.use('/api/projects', projectTicketsRouter);
app.use('/api/tickets', ticketsRouter);

app.use(notFound);
app.use(errorHandler);
