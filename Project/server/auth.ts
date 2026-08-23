import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cyberguard_super_secure_jwt_secret_2026_soc_key_991823';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded) {
      return res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }

    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled by an administrator.' });
    }

    req.user = user;
    next();
  });
}

export function requireRole(allowedRoles: Array<'admin' | 'analyst' | 'viewer'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. This action requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is: ${req.user.role}.`
      });
    }

    next();
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireAnalystOrAdmin = requireRole(['admin', 'analyst']);
