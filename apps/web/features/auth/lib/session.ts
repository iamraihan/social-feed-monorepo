import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/config/env';
import { sessionUserSchema } from '../schemas/auth-schemas';
import type { SessionUser } from '../types';

// Frontend session cookies — set by server actions after a successful auth
// handshake, read by Server Components / proxy. The three cookies serve
// different purposes:
//
//   access_token   — sent as Bearer to the backend; lives only as long as
//                    the access token TTL the backend issued (expiresIn).
//                    httpOnly so JS can't read it.
//   refresh_token  — the cookie value the backend issued. The proxy gates
//                    on its presence (httpOnly = forgery-resistant). Used
//                    by /auth/refresh to rotate.
//   session_user   — JSON-encoded SessionUser. NOT httpOnly so Client
//                    Components can read it for UX (avatar, name) without
//                    an extra round-trip. It's a CACHE, never a credential
//                    — the proxy NEVER trusts it. getSession() re-validates
//                    via Zod on every read to refuse tampered cookies.

export const COOKIE_ACCESS_TOKEN = 'access_token';
export const COOKIE_REFRESH_TOKEN = 'refresh_token';
export const COOKIE_SESSION_USER = 'session_user';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

interface SetSessionInput {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  user: SessionUser;
}

function commonCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function setSessionCookies(input: SetSessionInput): Promise<void> {
  const jar = await cookies();
  const base = commonCookieOptions();

  jar.set(COOKIE_ACCESS_TOKEN, input.accessToken, {
    ...base,
    maxAge: input.expiresInSeconds,
  });
  jar.set(COOKIE_REFRESH_TOKEN, input.refreshToken, {
    ...base,
    maxAge: REFRESH_TTL_SECONDS,
  });
  jar.set(COOKIE_SESSION_USER, JSON.stringify(input.user), {
    ...base,
    httpOnly: false, // see file header — readable by Client Components
    maxAge: REFRESH_TTL_SECONDS,
  });
}

/**
 * Rotate only the access + refresh tokens (used after /auth/refresh). The
 * session_user cookie is left untouched — the refresh endpoint returns no
 * user payload.
 */
export async function rotateSessionTokens(input: {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
}): Promise<void> {
  const jar = await cookies();
  const base = commonCookieOptions();
  jar.set(COOKIE_ACCESS_TOKEN, input.accessToken, {
    ...base,
    maxAge: input.expiresInSeconds,
  });
  jar.set(COOKIE_REFRESH_TOKEN, input.refreshToken, {
    ...base,
    maxAge: REFRESH_TTL_SECONDS,
  });
}

/**
 * Clear all session cookies. We set them to empty with maxAge:0 (not just
 * .delete()) because .delete() does not always include the original
 * `path`/`secure`/`sameSite` attributes, and some browsers refuse to delete
 * a secure cookie when the delete instruction lacks those attributes.
 */
export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  const base = commonCookieOptions();
  const expire = { ...base, maxAge: 0 };
  jar.set(COOKIE_ACCESS_TOKEN, '', expire);
  jar.set(COOKIE_REFRESH_TOKEN, '', expire);
  jar.set(COOKIE_SESSION_USER, '', { ...expire, httpOnly: false });
}

/**
 * Read the current session. Wrapped in React.cache so multiple Server
 * Components in the same render tree share a single cookie read + JSON
 * parse + Zod validation. Returns null if the cookie is missing, malformed,
 * or fails schema validation.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const raw = jar.get(COOKIE_SESSION_USER)?.value;
  if (!raw) return null;
  try {
    const parsed = sessionUserSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_ACCESS_TOKEN)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_REFRESH_TOKEN)?.value ?? null;
}
