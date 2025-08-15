// server-only helper: verify JWT from httpOnly cookie
// Note: runs in Next.js server component runtime
import { cookies } from 'next/headers';

// Use require to avoid compile-time type issues if `jsonwebtoken` types are not present
const jwt = require('jsonwebtoken');

type JwtPayload = {
  userId: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
};

export function getAccessToken(): string | null {
  // cookies() can be RequestCookies or a Promise depending on runtime typings; cast to any to access .get
  const cookieStore = (cookies() as any);
  const c = cookieStore?.get ? cookieStore.get('accessToken') : undefined;
  return c?.value ?? null;
}

export function verifyAccessToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const payload = jwt.verify(token, secret) as JwtPayload;
    return payload;
  } catch (e) {
    return null;
  }
}

export function getVerifiedUser() {
  const token = getAccessToken();
  return verifyAccessToken(token);
}
