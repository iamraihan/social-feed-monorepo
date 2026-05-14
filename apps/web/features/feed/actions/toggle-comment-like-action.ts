'use server';

import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { requireSession } from '@/features/auth/lib/session';
import { likeTarget, unlikeTarget } from '../api/likes-api';
import type { LikeTarget } from '../types';

// Single action covers COMMENT and REPLY targets — backend enforces that the
// path segment matches the comment's actual shape (parentId null vs not).
// `target` is constrained to the polymorphic union so a caller can't ask for
// POST through this action (use togglePostLikeAction for that — they have
// different optimistic cache patches).

type ToggleResult = { ok: true } | { ok: false; error: string };

export async function toggleCommentLikeAction(input: {
  target: Extract<LikeTarget, 'comment' | 'reply'>;
  commentId: string;
  liked: boolean;
}): Promise<ToggleResult> {
  await requireSession();
  try {
    if (input.liked) {
      await likeTarget(input.target, input.commentId);
    } else {
      await unlikeTarget(input.target, input.commentId);
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiClientError) {
      logError('[feed/toggle-comment-like] backend error', {
        code: err.code,
        status: err.status,
        commentId: input.commentId,
        target: input.target,
      });
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Could not update like. Try again.' };
  }
}
