import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

export const changesRouter = Router();

changesRouter.use(authenticateJwt);
changesRouter.use(requireOrg);

// GET /api/changes
changesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const { service, type } = req.query;

    const whereClause: any = { organizationId: orgId };

    if (service && service !== 'ALL') {
      whereClause.serviceName = String(service);
    }

    if (type && type !== 'ALL') {
      whereClause.changeType = String(type);
    }

    const changes = await prisma.change.findMany({
      where: whereClause,
      include: {
        incidentChanges: {
          select: { incidentId: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const transformed = changes.map((c) => ({
      id: c.id,
      serviceId: c.serviceId,
      serviceName: c.serviceName,
      changeType: c.changeType,
      title: c.title,
      description: c.description,
      author: c.author,
      environment: c.environment,
      timestamp: c.timestamp,
      riskScore: c.riskScore,
      riskLevel: c.riskLevel,
      diff: c.diff,
      metadata: c.metadata,
      linkedIncidentsCount: c.incidentChanges.length,
    }));

    res.json({
      success: true,
      data: transformed,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/changes/:id
changesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const change = await prisma.change.findFirst({
      where: { id: String(id), organizationId: orgId },
      include: {
        riskScoreRecord: true,
        incidentChanges: {
          include: { incident: true },
        },
      },
    });

    if (!change) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Change not found' } });
      return;
    }

    res.json({
      success: true,
      data: change,
    });
  } catch (err) {
    next(err);
  }
});
