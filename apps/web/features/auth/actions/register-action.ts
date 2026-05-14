'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { registerRequest } from '../api/auth-api';
import { setSessionCookies } from '../lib/session';
import {
  backendRegisterSchema,
  registerSchema,
  type RegisterInput,
} from '../schemas/auth-schemas';
import type { ActionResult } from '../types';

type RegisterActionResult = ActionResult<keyof RegisterInput>;

export async function registerAction(
  input: RegisterInput,
): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const payload = backendRegisterSchema.parse(parsed.data);
    const { tokens, refreshToken } = await registerRequest(payload);
    await setSessionCookies({
      accessToken: tokens.accessToken,
      expiresInSeconds: tokens.expiresIn,
      refreshToken,
      user: tokens.user,
    });
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'CONFLICT') {
        return {
          ok: false,
          fieldErrors: { email: ['An account with this email already exists.'] },
        };
      }
      if (err.code === 'TOO_MANY_REQUESTS') {
        return {
          ok: false,
          formError: 'Too many sign-up attempts. Please wait a minute.',
        };
      }
      if (err.code === 'VALIDATION_FAILED') {
        return { ok: false, formError: err.details?.[0] ?? err.message };
      }
      logError('[auth/register] backend error', {
        code: err.code,
        status: err.status,
      });
      return { ok: false, formError: err.message };
    }
    logError('[auth/register] unexpected error', {
      message: (err as Error).message,
    });
    return { ok: false, formError: 'Something went wrong. Try again.' };
  }

  redirect('/');
}
