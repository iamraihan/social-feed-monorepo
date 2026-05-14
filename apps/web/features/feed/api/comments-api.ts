import 'server-only';
import { authenticatedFetch } from '@/lib/auth-fetch';
import type {
  Comment,
  CommentPage,
  CommentPageMeta,
} from '../types';

// Server-side wrappers around backend /posts/:id/comments and /comments
// endpoints. Called from Server Components / Server Actions only — bearer
// token never leaves the server. Like operations live in likes-api.ts so the
// same `likeTarget` helper covers post / comment / reply uniformly.

const DEFAULT_COMMENT_LIMIT = 20;

export interface CommentsQueryParams {
  cursor?: string;
  limit?: number;
}

function buildSearch(params: CommentsQueryParams): string {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  search.set('limit', String(params.limit ?? DEFAULT_COMMENT_LIMIT));
  return search.toString();
}

function emptyMeta(limit: number): CommentPageMeta {
  return { hasMore: false, nextCursor: null, limit };
}

export async function listPostComments(
  postId: string,
  params: CommentsQueryParams = {},
): Promise<CommentPage> {
  const { data, meta } = await authenticatedFetch<Comment[], CommentPageMeta>(
    `/posts/${postId}/comments?${buildSearch(params)}`,
  );
  return { data, meta: meta ?? emptyMeta(params.limit ?? DEFAULT_COMMENT_LIMIT) };
}

export async function listCommentReplies(
  commentId: string,
  params: CommentsQueryParams = {},
): Promise<CommentPage> {
  const { data, meta } = await authenticatedFetch<Comment[], CommentPageMeta>(
    `/comments/${commentId}/replies?${buildSearch(params)}`,
  );
  return { data, meta: meta ?? emptyMeta(params.limit ?? DEFAULT_COMMENT_LIMIT) };
}

export async function createComment(
  postId: string,
  content: string,
): Promise<Comment> {
  const { data } = await authenticatedFetch<Comment>(
    `/posts/${postId}/comments`,
    { method: 'POST', body: { content } },
  );
  return data;
}

export async function createReply(
  parentCommentId: string,
  content: string,
): Promise<Comment> {
  const { data } = await authenticatedFetch<Comment>(
    `/comments/${parentCommentId}/replies`,
    { method: 'POST', body: { content } },
  );
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await authenticatedFetch<void>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}
