import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

export const timelineRouter = Router();

timelineRouter.use(authenticateJwt);
timelineRouter.use(requireOrg);

// GET /api/timeline
timelineRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const { type, service, env } = req.query;

    const whereClause: any = { organizationId: orgId };

    if (service && service !== 'ALL') {
      whereClause.serviceName = String(service);
    }

    if (env && env !== 'ALL') {
      whereClause.environment = String(env);
    }

    if (type && type !== 'ALL') {
      whereClause.eventType = String(type);
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
});
