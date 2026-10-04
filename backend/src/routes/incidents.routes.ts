import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

export const incidentsRouter = Router();

incidentsRouter.use(authenticateJwt);
incidentsRouter.use(requireOrg);

// GET /api/incidents
incidentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const { status, severity, service } = req.query;

    const whereClause: any = { organizationId: orgId };

    if (status && status !== 'ALL') {
      whereClause.status = String(status);
    }
    if (severity && severity !== 'ALL') {
      whereClause.severity = String(severity);
    }
    if (service && service !== 'ALL') {
      whereClause.serviceName = String(service);
    }

    const incidents = await prisma.incident.findMany({
      where: whereClause,
      include: {
        incidentChanges: {
          include: { change: true },
          orderBy: { correlationScore: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = incidents.map((inc) => ({
      id: inc.id,
      serviceName: inc.serviceName,
      title: inc.title,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      riskScore: inc.riskScore,
      riskLevel: inc.riskLevel,
      probableCauseChange: inc.probableCauseChange,
      confidenceScore: inc.confidenceScore,
      startedAt: inc.startedAt,
      resolvedAt: inc.resolvedAt,
      relatedChangesCount: inc.incidentChanges.length,
      createdAt: inc.createdAt,
    }));

    res.json({
      success: true,
      data: transformed,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id
incidentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const id = String(req.params.id);

    const incident = await prisma.incident.findFirst({
      where: {
        organizationId: orgId,
        OR: [{ id }, { id: { contains: id } }],
      },
      include: {
        service: true,
        incidentChanges: {
          include: {
            change: {
              include: { riskScoreRecord: true },
            },
          },
          orderBy: { correlationScore: 'desc' },
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } });
      return;
    }

    // Pre & Post change telemetry points
    const metrics = await prisma.metric.findMany({
      where: {
        organizationId: orgId,
        serviceName: incident.serviceName,
      },
      orderBy: { timestamp: 'asc' },
      take: 40,
    });

    // Recent logs around the incident
    const logs = [
      { id: 'log-1', timestamp: new Date(incident.startedAt.getTime() - 2 * 60 * 1000).toISOString(), severity: 'INFO', message: 'Task definition payment-service:142 launched by ECS agent' },
      { id: 'log-2', timestamp: new Date(incident.startedAt.getTime() - 1 * 60 * 1000).toISOString(), severity: 'WARN', message: 'DB connection pool allocated threads exhausted (active: 5/5)' },
      { id: 'log-3', timestamp: incident.startedAt.toISOString(), severity: 'ERROR', message: 'ConnectionTimeoutError: Pool acquisition timed out after 5000ms' },
      { id: 'log-4', timestamp: new Date(incident.startedAt.getTime() + 1 * 60 * 1000).toISOString(), severity: 'CRITICAL', message: 'HTTP 504 Gateway Timeout on /v1/charge - latency 850ms exceeded SLA' },
      { id: 'log-5', timestamp: new Date(incident.startedAt.getTime() + 2 * 60 * 1000).toISOString(), severity: 'ERROR', message: 'Circuit breaker OPEN on payment-service downstream' },
    ];

    res.json({
      success: true,
      data: {
        incident,
        telemetry: metrics,
        logs,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/incidents/:id/status
const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED']),
});

incidentsRouter.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const id = String(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);

    const updated = await prisma.incident.updateMany({
      where: {
        organizationId: orgId,
        OR: [{ id }, { id: { contains: id } }],
      },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    if (updated.count === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } });
      return;
    }

    res.json({
      success: true,
      message: `Incident status updated to ${status}`,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/acknowledge
incidentsRouter.post('/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!;
    const id = String(req.params.id);

    await prisma.incident.updateMany({
      where: {
        organizationId: orgId,
        OR: [{ id }, { id: { contains: id } }],
      },
      data: { status: 'INVESTIGATING' },
    });

    res.json({
      success: true,
      message: 'Incident acknowledged and moved to INVESTIGATING',
    });
  } catch (err) {
    next(err);
  }
});
