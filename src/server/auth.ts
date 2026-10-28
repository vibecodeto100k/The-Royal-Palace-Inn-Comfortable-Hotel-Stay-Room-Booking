import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'the-royal-palace-inn-secure-jwt-token-2026';

export interface AdminPayload {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminPayload;
}

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function verifyPassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

export function generateToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

// In-memory rate limiting map for login attempts: ip -> { count: number, lockedUntil: number }
const loginRateLimitMap = new Map<string, { attempts: number; lockedUntil: number }>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  if (entry.lockedUntil > now) {
    const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // If lock period has expired, reset
  if (entry.lockedUntil !== 0 && entry.lockedUntil <= now) {
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  // Lock for 15 minutes if more than 5 failed attempts
  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000;
  }

  loginRateLimitMap.set(ip, entry);
}

export function resetLoginAttempts(ip: string) {
  loginRateLimitMap.delete(ip);
}

// Authentication middleware
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    // Check if token in cookie
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('rpi_admin_token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  req.admin = payload;
  next();
}

export function recordAuditLog(action: string, details: string, performedBy: string, ipAddress?: string) {
  try {
    const id = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO audit_logs (id, action, details, performed_by, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, action, details, performedBy, ipAddress || 'system');
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
