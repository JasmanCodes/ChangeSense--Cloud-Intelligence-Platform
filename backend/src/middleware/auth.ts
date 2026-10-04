import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  role: 'ADMIN' | 'VIEWER';
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      organizationId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'changesense-super-secret-access-token-key-2026!';

export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.cs_access_token;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    req.organizationId = decoded.organizationId;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' },
    });
    return;
  }
}

/**
 * Ensures request has an authenticated organization context taken directly from the verified token
 */
export async function requireOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.organizationId) {
    res.status(401).json({
      success: false,
      error: { code: 'MISSING_ORG', message: 'Organization context is missing' },
    });
    return;
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
      select: { id: true, name: true },
    });

    if (!org) {
      res.status(404).json({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
      return;
    }

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify organization context' },
    });
  }
}

/**
 * Role-based authorization middleware (e.g. requireRole('ADMIN'))
 */
export function requireRole(allowedRole: 'ADMIN' | 'VIEWER') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (allowedRole === 'ADMIN' && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin permissions required to perform this action',
        },
      });
      return;
    }

    next();
  };
}
