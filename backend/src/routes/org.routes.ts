import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { authenticateJwt, requireOrg, requireRole } from '../middleware/auth.js';

export const orgRouter = Router();

orgRouter.use(authenticateJwt);
orgRouter.use(requireOrg);

// GET /api/org
orgRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
      include: {
        enabledServices: true,
        awsConnections: true,
        _count: {
          select: { users: true, services: true, incidents: true, changes: true },
        },
      },
    });

    if (!org) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        industry: org.industry,
        teamSize: org.teamSize,
        externalId: org.externalId,
        createdAt: org.createdAt,
        counts: org._count,
        awsConnection: org.awsConnections[0] || null,
        enabledServices: org.enabledServices.reduce(
          (acc, s) => ({ ...acc, [s.serviceKey]: s.enabled }),
          {}
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/org (requires ADMIN)
const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
});

orgRouter.patch('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateOrgSchema.parse(req.body);

    const updated = await prisma.organization.update({
      where: { id: req.organizationId },
      data,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.userId,
        action: 'ORGANIZATION_UPDATED',
        details: data,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/org/services
orgRouter.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await prisma.enabledService.findMany({
      where: { organizationId: req.organizationId },
    });

    const serviceMap = services.reduce(
      (acc, s) => ({ ...acc, [s.serviceKey]: s.enabled }),
      {}
    );

    res.json({
      success: true,
      data: serviceMap,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/org/services/toggle (requires ADMIN)
const toggleServiceSchema = z.object({
  serviceKey: z.enum(['change-tracking', 'incident-detection', 'security-drift', 'ai-assistant']),
  enabled: z.boolean(),
});

orgRouter.post('/services/toggle', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceKey, enabled } = toggleServiceSchema.parse(req.body);

    const record = await prisma.enabledService.upsert({
      where: {
        organizationId_serviceKey: {
          organizationId: req.organizationId!,
          serviceKey,
        },
      },
      update: { enabled },
      create: {
        organizationId: req.organizationId!,
        serviceKey,
        enabled,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.userId,
        action: enabled ? 'SERVICE_ENABLED' : 'SERVICE_DISABLED',
        details: { serviceKey },
      },
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/org/team
orgRouter.get('/team', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/org/team/invite (requires ADMIN)
const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
});

orgRouter.post('/team/invite', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = inviteSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'User with this email already exists' },
      });
      return;
    }

    const defaultPassword = 'ChangeSense2026!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        organizationId: req.organizationId!,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        role: data.role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.userId,
        action: 'TEAM_MEMBER_INVITED',
        details: { invitedEmail: data.email, role: data.role },
      },
    });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
});
