'use server';

import { ApiClientError } from '@/lib/api-client';
import { logError } from '@/lib/safe-log';
import { requireSession } from '@/features/auth/lib/session';
import { deletePost } from '../api/feed-api';

type DeletePostResult = { ok: true } | { ok: false; error: string };

// NOTE: no `revalidatePath('/')` here. Triggering a server-side route refresh
// while the confirmation modal is closing was racing the modal's state
// transition and blanking the screen for the user. The client uses TanStack
// to drop the deleted post from every cached feed list (see
// `use-delete-post.ts`), so the UI updates instantly without bouncing through
// the server-rendered shell.

export async function deletePostAction(
  postId: string,
): Promise<DeletePostResult> {
  await requireSession();
  try {
    await deletePost(postId);
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'FORBIDDEN') {
        return { ok: false, error: 'You can only delete your own posts.' };
      }
      logError('[feed/delete] backend error', {
        code: err.code,
        status: err.status,
        postId,
      });
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Could not delete post. Try again.' };
  }
}
