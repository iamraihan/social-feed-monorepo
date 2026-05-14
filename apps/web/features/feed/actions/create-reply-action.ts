'use server';

import { z } from 'zod';
import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { requireSession } from '@/features/auth/lib/session';
import { createReply } from '../api/comments-api';
import { createCommentSchema } from '../schemas/comment-schemas';
import type { Comment } from '../types';

// Replies share the same shape + validation rules as top-level comments —
// backend enforces a 1-level cap (no reply-to-a-reply) so this action just
// trusts the parent id and lets the API surface BAD_REQUEST if violated.

export type CreateReplyResult =
  | { ok: true; reply: Comment }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: { content?: string[] };
    };

export async function createReplyAction(input: {
  parentCommentId: string;
  content: string;
}): Promise<CreateReplyResult> {
  await requireSession();

  const parsed = createCommentSchema.safeParse({ content: input.content });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const reply = await createReply(
      input.parentCommentId,
      parsed.data.content,
    );
    return { ok: true, reply };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'NOT_FOUND') {
        return { ok: false, formError: 'This comment is no longer available.' };
      }
      if (err.code === 'BAD_REQUEST') {
        // Surfaced by the backend's "cannot reply to a reply" guard.
        return { ok: false, formError: err.message };
      }
      if (err.code === 'TOO_MANY_REQUESTS') {
        return {
          ok: false,
          formError: 'You are commenting too fast. Wait a moment.',
        };
      }
      logError('[feed/create-reply] backend error', {
        code: err.code,
        status: err.status,
        parentCommentId: input.parentCommentId,
      });
      return { ok: false, formError: err.message };
    }
    return { ok: false, formError: 'Could not post reply. Try again.' };
  }
}
