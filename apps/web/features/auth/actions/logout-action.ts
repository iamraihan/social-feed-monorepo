'use server';

import { redirect } from 'next/navigation';
import { logError } from '@/lib/safe-log';
import { logoutRequest } from '../api/auth-api';
import {
  clearSessionCookies,
  getRefreshToken,
  getSession,
} from '../lib/session';

// Server Actions are public endpoints — any client (or any script that
// guesses the action ID) can POST to them. The proxy gate is not a
// substitute for an in-action auth check. Per Next.js docs:
// "Always verify authentication and authorization inside each Server
// Function rather than relying on Proxy alone."
//
// Logout is benign even without a session (it just clears empty cookies),
// but we still skip the backend round-trip when there's no session — saves
// noise on the auth service's logs and rate-limit buckets.

export async function logoutAction(): Promise<never> {
  const session = await getSession();
  if (!session) redirect('/login');

  const refreshToken = await getRefreshToken();
  try {
    await logoutRequest(refreshToken ?? undefined);
  } catch (err) {
    // Best-effort: log for ops but never block the user from logging out
    // locally. Backend may stay holding a valid refresh token until TTL,
    // but the user's browser will have no way to use it.
    logError('[auth/logout] backend logout failed', {
      message: (err as Error).message,
    });
  }
  await clearSessionCookies();
  redirect('/login');
}
