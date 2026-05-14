import 'server-only';
import { authenticatedFetch } from '@/lib/auth-fetch';
import type { LikerPage, LikerPageMeta, LikeTarget } from '../types';

// Server-side wrappers around backend /likes endpoints. The backend exposes
// a single set of routes that take a polymorphic target type (POST / COMMENT
// / REPLY) — same shape for all three, so one client surface covers them.
//
// Path segments are constrained at the type level (`LikeTarget`) so misuse
// (e.g. `likeTarget('postt', id)`) fails to typecheck instead of round-
// tripping a 400.

const DEFAULT_LIKER_LIMIT = 20;

const LIKE_TARGET_PATH: Record<LikeTarget, string> = {
  post: 'post',
  comment: 'comment',
  reply: 'reply',
};

export async function likeTarget(
  target: LikeTarget,
  targetId: string,
): Promise<void> {
  await authenticatedFetch<{ liked: true }>(
    `/likes/${LIKE_TARGET_PATH[target]}/${targetId}`,
    { method: 'POST' },
  );
}

export async function unlikeTarget(
  target: LikeTarget,
  targetId: string,
): Promise<void> {
  await authenticatedFetch<void>(
    `/likes/${LIKE_TARGET_PATH[target]}/${targetId}`,
    { method: 'DELETE' },
  );
}

export interface LikersQueryParams {
  cursor?: string;
  limit?: number;
}

export async function listLikers(
  target: LikeTarget,
  targetId: string,
  params: LikersQueryParams = {},
): Promise<LikerPage> {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  search.set('limit', String(params.limit ?? DEFAULT_LIKER_LIMIT));

  const { data, meta } = await authenticatedFetch<
    LikerPage['data'],
    LikerPageMeta
  >(`/likes/${LIKE_TARGET_PATH[target]}/${targetId}/users?${search.toString()}`);

  return {
    data,
    meta: meta ?? {
      hasMore: false,
      nextCursor: null,
      limit: params.limit ?? DEFAULT_LIKER_LIMIT,
      total: data.length,
    },
  };
}
