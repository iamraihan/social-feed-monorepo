'use server';

import { requireSession } from '@/features/auth/lib/session';
import {
  listPostComments,
  type CommentsQueryParams,
} from '../api/comments-api';
import type { CommentPage } from '../types';

// queryFn target for useInfiniteQuery on the post's top-level comments.
// Server Action wrapper keeps cookies/bearer server-side; the browser only
// sees the comment payload.

export async function fetchCommentsPageAction(input: {
  postId: string;
  params?: CommentsQueryParams;
}): Promise<CommentPage> {
  await requireSession();
  return listPostComments(input.postId, input.params);
}
