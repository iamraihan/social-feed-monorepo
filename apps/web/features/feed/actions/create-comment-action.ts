'use server';

import { z } from 'zod';
import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { requireSession } from '@/features/auth/lib/session';
import { createComment } from '../api/comments-api';
import { createCommentSchema } from '../schemas/comment-schemas';
import type { Comment } from '../types';

// Discriminated union mirroring the post-create / like actions. The hook
// rolls back its optimistic insert when `ok: false` and surfaces `error` /
// `fieldErrors` to the composer.

export type CreateCommentResult =
  | { ok: true; comment: Comment }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: { content?: string[] };
    };

export async function createCommentAction(input: {
  postId: string;
  content: string;
}): Promise<CreateCommentResult> {
  await requireSession();

  const parsed = createCommentSchema.safeParse({ content: input.content });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const comment = await createComment(input.postId, parsed.data.content);
    return { ok: true, comment };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'NOT_FOUND') {
        return { ok: false, formError: 'This post is no longer available.' };
      }
      if (err.code === 'TOO_MANY_REQUESTS') {
        return {
          ok: false,
          formError: 'You are commenting too fast. Wait a moment.',
        };
      }
      if (err.code === 'VALIDATION_FAILED') {
        return {
          ok: false,
          fieldErrors: { content: [err.details?.[0] ?? err.message] },
        };
      }
      logError('[feed/create-comment] backend error', {
        code: err.code,
        status: err.status,
        postId: input.postId,
      });
      return { ok: false, formError: err.message };
    }
    return { ok: false, formError: 'Could not post comment. Try again.' };
  }
}
