import jwt from 'jsonwebtoken';
import { TokenPayload } from '../middleware/auth.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'changesense-super-secret-access-token-key-2026!';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changesense-super-secret-refresh-token-key-2026!';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
}

export function signRefreshToken(payload: { userId: string; organizationId: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
}

export function verifyRefreshToken(token: string): { userId: string; organizationId: string } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string; organizationId: string };
}
