'use server';

import { requireSession } from '@/features/auth/lib/session';
import {
  listCommentReplies,
  type CommentsQueryParams,
} from '../api/comments-api';
import type { CommentPage } from '../types';

// queryFn target for the lazy-expand replies under a top-level comment.

export async function fetchRepliesPageAction(input: {
  commentId: string;
  params?: CommentsQueryParams;
}): Promise<CommentPage> {
  await requireSession();
  return listCommentReplies(input.commentId, input.params);
}
