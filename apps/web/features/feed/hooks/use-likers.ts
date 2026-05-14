'use client';

import {
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchLikersPageAction } from '../actions/fetch-likers-page-action';
import { feedKeys } from '../lib/feed-keys';
import type { LikerPage, LikeTarget } from '../types';

// Drives the "who liked" modal. Gated by `enabled` so the fetch doesn't run
// until the modal opens.

interface UseLikersOptions {
  target: LikeTarget;
  targetId: string;
  limit?: number;
  enabled?: boolean;
}

export function useLikers({
  target,
  targetId,
  limit = 20,
  enabled = false,
}: UseLikersOptions) {
  return useInfiniteQuery<
    LikerPage,
    Error,
    InfiniteData<LikerPage, string | undefined>,
    ReturnType<typeof feedKeys.likers>,
    string | undefined
  >({
    queryKey: feedKeys.likers(target, targetId),
    queryFn: ({ pageParam }) =>
      fetchLikersPageAction({
        target,
        targetId,
        params: { cursor: pageParam, limit },
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) =>
      last.meta.hasMore && last.meta.nextCursor
        ? last.meta.nextCursor
        : undefined,
    enabled,
    staleTime: 30_000,
  });
}
