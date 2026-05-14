'use server';

import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { requireSession } from '@/features/auth/lib/session';
import { deleteComment } from '../api/comments-api';

type DeleteCommentResult = { ok: true } | { ok: false; error: string };

export async function deleteCommentAction(
  commentId: string,
): Promise<DeleteCommentResult> {
  await requireSession();
  try {
    await deleteComment(commentId);
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'FORBIDDEN') {
        return { ok: false, error: 'You can only delete your own comments.' };
      }
      if (err.code === 'NOT_FOUND') {
        return { ok: false, error: 'This comment is no longer available.' };
      }
      logError('[feed/delete-comment] backend error', {
        code: err.code,
        status: err.status,
        commentId,
      });
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Could not delete comment. Try again.' };
  }
}
