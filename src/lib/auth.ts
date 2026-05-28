import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

// Session management using cookies with proper JWT signing
const SESSION_COOKIE = 'rdl_admin_session';

// SECURITY: Get JWT_SECRET at runtime, not build time (Cloudflare Pages limitation)
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[FATAL] JWT_SECRET environment variable not set. This is required for security. Set JWT_SECRET in your .env or environment.');
  }
  return secret;
}

// bcrypt password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT-based session token
export function createSessionToken(adminId: string, username: string): string {
  const payload = { id: adminId, username, ts: Date.now() };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export function parseSessionToken(token: string): { id: string; username: string; ts: number } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; username: string; ts: number; iat: number; exp: number };
    return { id: decoded.id, username: decoded.username, ts: decoded.ts };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<{ id: string; username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = parseSessionToken(token);
  if (!session) return null;

  const admin = await db.admin.findUnique({ where: { id: session.id } });
  if (!admin) return null;

  return { id: admin.id, username: admin.username };
}

export { SESSION_COOKIE };
