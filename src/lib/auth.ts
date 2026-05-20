import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

// Session management using cookies with proper JWT signing
const SESSION_COOKIE = 'rdl_admin_session';
// SECURITY: Fail hard if no JWT secret is configured - never use a fallback in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[AUTH WARNING] JWT_SECRET environment variable not set. Using development fallback. Set JWT_SECRET in production!');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'rdl-pro-matka-dev-only-secret-DO-NOT-USE-IN-PROD';

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
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: '24h' });
}

export function parseSessionToken(token: string): { id: string; username: string; ts: number } | null {
  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as { id: string; username: string; ts: number; iat: number; exp: number };
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
