import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { getDatabase } from '../db/database';
import { AuthenticatedRequestUser, UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

/**
 * Authentication Middleware:
 * Validates JWT AND verifies real-time tokenVersion against the live database
 * to provide instantaneous session revocation across all active devices.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  try {
    const payload = jwt.verify(token, CONFIG.JWT_SECRET) as any;

    if (!payload.id || !payload.tokenVersion) {
      res.status(401).json({ error: 'Malformed authentication token.' });
      return;
    }

    const db = getDatabase();
    const user = db.prepare('SELECT id, email, role, token_version FROM users WHERE id = ?').get(payload.id) as {
      id: string;
      email: string;
      role: UserRole;
      token_version: number;
    } | undefined;

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }

    // Immediate Session Revocation Check:
    // If tokenVersion in JWT does not match the database, this token was revoked!
    if (user.token_version !== payload.tokenVersion) {
      res.status(401).json({
        error: 'Session has been revoked or invalidated. Please sign in again.',
        code: 'SESSION_REVOKED',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.token_version,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Authentication token has expired. Please sign in again.', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token.', details: err.message });
  }
}

/**
 * Role-Based Access Control Middleware Helper.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Action requires one of roles [${allowedRoles.join(', ')}], but current role is '${req.user.role}'`,
      });
      return;
    }

    next();
  };
}
