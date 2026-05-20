import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const record = loginAttempts.get(ip);
  if (!record) return false;

  const now = Date.now();
  if (now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string, success: boolean): void {
  const record = loginAttempts.get(ip);
  const now = Date.now();

  if (!record || now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: success ? 0 : 1, lastAttempt: now });
  } else {
    record.lastAttempt = now;
    record.count = success ? 0 : record.count + 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const admin = await db.admin.findUnique({ where: { username } });
    if (!admin) {
      recordAttempt(ip, false);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, admin.password);
    if (!isValid) {
      recordAttempt(ip, false);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    recordAttempt(ip, true);

    const token = createSessionToken(admin.id, admin.username);
    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, username: admin.username },
    });

    // Determine if the connection is HTTPS (directly or via proxy)
    // If using a reverse proxy (Nginx, Caddy, etc.), check X-Forwarded-Proto
    // IMPORTANT: Do NOT use NODE_ENV to determine this — HTTP hosting should
    // always get non-secure cookies so the browser actually stores them.
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
