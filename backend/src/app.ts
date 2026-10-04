import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { prisma } from './db/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app: Express = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:80',
  'http://localhost:4000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in local dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Quick ping to PostgreSQL via Prisma
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      app: 'ChangeSense Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected (PostgreSQL)',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      app: 'ChangeSense Platform API',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

import { authRouter } from './routes/auth.routes.js';
import { orgRouter } from './routes/org.routes.js';
import { demoRouter } from './routes/demo.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { timelineRouter } from './routes/timeline.routes.js';
import { changesRouter } from './routes/changes.routes.js';
import { incidentsRouter } from './routes/incidents.routes.js';

// Route mounts
app.use('/api/auth', authRouter);
app.use('/api/org', orgRouter);
app.use('/api/demo', demoRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/changes', changesRouter);
app.use('/api/incidents', incidentsRouter);

// Centralized error handling
app.use(errorHandler);
