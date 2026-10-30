import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { getDatabase } from '../db/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'Access token required' } });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
  }

  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Insufficient permissions' } });
    }
    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  }
  next();
}

export function auditLog(action: string, resourceType?: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (body: any) {
      try {
        if (res.statusCode < 400) {
          const db = getDatabase();
          const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          db.prepare(
            `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent, metadata_json, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            id,
            req.user?.userId || null,
            action,
            resourceType || null,
            req.params?.id || null,
            req.ip || req.headers['x-forwarded-for'] || null,
            req.headers['user-agent'] || null,
            JSON.stringify({ method: req.method, path: req.path }),
            new Date().toISOString(),
          );
        }
      } catch (err) {
        console.error('Audit log failed:', err);
      }
      return originalSend.call(this, body);
    };
    next();
  };
}
