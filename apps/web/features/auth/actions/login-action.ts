'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { loginRequest } from '../api/auth-api';
import { setSessionCookies } from '../lib/session';
import { loginSchema, type LoginInput } from '../schemas/auth-schemas';
import type { ActionResult } from '../types';

type LoginActionResult = ActionResult<keyof LoginInput>;

export async function loginAction(input: LoginInput): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const { tokens, refreshToken } = await loginRequest(parsed.data);
    await setSessionCookies({
      accessToken: tokens.accessToken,
      expiresInSeconds: tokens.expiresIn,
      refreshToken,
      user: tokens.user,
    });
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'UNAUTHORIZED') {
        return { ok: false, formError: 'Invalid email or password.' };
      }
      if (err.code === 'TOO_MANY_REQUESTS') {
        return {
          ok: false,
          formError: 'Too many login attempts. Please wait a minute.',
        };
      }
      if (err.code === 'VALIDATION_FAILED') {
        return { ok: false, formError: err.details?.[0] ?? err.message };
      }
      // Unknown semantic codes get logged then surfaced as a generic error.
      logError('[auth/login] backend error', {
        code: err.code,
        status: err.status,
      });
      return { ok: false, formError: err.message };
    }
    logError('[auth/login] unexpected error', {
      message: (err as Error).message,
    });
    return { ok: false, formError: 'Something went wrong. Try again.' };
  }

  redirect('/');
}
