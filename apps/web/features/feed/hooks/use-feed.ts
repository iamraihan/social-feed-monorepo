'use client';

import {
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchFeedPageAction } from '../actions/fetch-feed-page-action';
import { feedKeys } from '../lib/feed-keys';
import type { FeedPage } from '../types';

// Infinite-scroll wrapper around the feed Server Action. `initialData` lets
// the home page Server Component pre-fetch page 1 and seed the cache so
// React Query doesn't refetch on hydration.

interface UseFeedOptions {
  limit?: number;
  initialPage?: FeedPage;
}

export function useFeed({ limit = 20, initialPage }: UseFeedOptions = {}) {
  return useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage, string | undefined>,
    ReturnType<typeof feedKeys.list>,
    string | undefined
  >({
    queryKey: feedKeys.list({ limit }),
    queryFn: ({ pageParam }) =>
      fetchFeedPageAction({ cursor: pageParam, limit }),
    initialPageParam: undefined,
    getNextPageParam: (last) =>
      last.meta.hasMore && last.meta.nextCursor
        ? last.meta.nextCursor
        : undefined,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [undefined] }
      : undefined,
    staleTime: 30_000,
  });
}
