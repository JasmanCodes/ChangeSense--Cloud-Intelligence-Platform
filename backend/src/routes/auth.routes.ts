import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { authenticateJwt, requireOrg } from '../middleware/auth.js';

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create organization and user in a transaction
    const externalId = `cs-ext-${uuidv4().substring(0, 12)}`;

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.companyName.trim(),
          industry: data.industry || 'Cloud & Tech',
          teamSize: data.teamSize || '10-50',
          externalId,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: 'ADMIN',
          organizationId: org.id,
        },
      });

      // Default enabled services
      const defaultServices = [
        'change-tracking',
        'incident-detection',
        'security-drift',
        'ai-assistant',
      ];

      await Promise.all(
        defaultServices.map((key) =>
          tx.enabledService.create({
            data: {
              organizationId: org.id,
              serviceKey: key,
              enabled: true,
            },
          })
        )
      );

      return { org, user };
    });

    const tokenPayload = {
      userId: result.user.id,
      organizationId: result.org.id,
      role: result.user.role,
      email: result.user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: result.user.id, organizationId: result.org.id });

    // Set refresh token in httpOnly cookie
    res.cookie('cs_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          organizationId: result.org.id,
        },
        organization: {
          id: result.org.id,
          name: result.org.name,
          industry: result.org.industry,
          teamSize: result.org.teamSize,
          externalId: result.org.externalId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      include: {
        organization: {
          include: {
            enabledServices: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    const tokenPayload = {
      userId: user.id,
      organizationId: user.organization.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id, organizationId: user.organization.id });

    res.cookie('cs_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organization.id,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          industry: user.organization.industry,
          teamSize: user.organization.teamSize,
          externalId: user.organization.externalId,
        },
        enabledServices: user.organization.enabledServices.reduce(
          (acc, s) => ({ ...acc, [s.serviceKey]: s.enabled }),
          {}
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.cs_refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Refresh token is required' },
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || user.organizationId !== decoded.organizationId) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'User or tenant does not exist' },
      });
      return;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organization.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_EXPIRED', message: 'Refresh token expired or invalid' },
    });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('cs_refresh_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', authenticateJwt, requireOrg, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        organization: {
          include: {
            enabledServices: true,
            awsConnections: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organization.id,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          industry: user.organization.industry,
          teamSize: user.organization.teamSize,
          externalId: user.organization.externalId,
        },
        enabledServices: user.organization.enabledServices.reduce(
          (acc, s) => ({ ...acc, [s.serviceKey]: s.enabled }),
          {}
        ),
        awsConnection: user.organization.awsConnections[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});
