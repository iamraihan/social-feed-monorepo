'use client';

import {
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchCommentsPageAction } from '../actions/fetch-comments-page-action';
import { feedKeys } from '../lib/feed-keys';
import type { CommentPage } from '../types';

// Lazy infinite-scroll over a post's top-level comments. `enabled` gates the
// initial fetch so we don't pay the round-trip until the user expands the
// comment section. Cache key is keyed by postId so multiple posts on screen
// each get their own paginated cache.

interface UseCommentsOptions {
  postId: string;
  limit?: number;
  enabled?: boolean;
}

export function useComments({
  postId,
  limit = 20,
  enabled = true,
}: UseCommentsOptions) {
  return useInfiniteQuery<
    CommentPage,
    Error,
    InfiniteData<CommentPage, string | undefined>,
    ReturnType<typeof feedKeys.comments>,
    string | undefined
  >({
    queryKey: feedKeys.comments(postId),
    queryFn: ({ pageParam }) =>
      fetchCommentsPageAction({
        postId,
        params: { cursor: pageParam, limit },
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) =>
      last.meta.hasMore && last.meta.nextCursor
        ? last.meta.nextCursor
        : undefined,
    enabled,
    staleTime: 15_000,
  });
}
