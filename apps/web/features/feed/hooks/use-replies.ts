'use client';

import {
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchRepliesPageAction } from '../actions/fetch-replies-page-action';
import { feedKeys } from '../lib/feed-keys';
import type { CommentPage } from '../types';

// Replies are loaded on-demand under a top-level comment. `enabled` keeps the
// fetch dormant until the user clicks "View N replies", matching the design's
// progressive disclosure.

interface UseRepliesOptions {
  commentId: string;
  limit?: number;
  enabled?: boolean;
}

export function useReplies({
  commentId,
  limit = 10,
  enabled = false,
}: UseRepliesOptions) {
  return useInfiniteQuery<
    CommentPage,
    Error,
    InfiniteData<CommentPage, string | undefined>,
    ReturnType<typeof feedKeys.replies>,
    string | undefined
  >({
    queryKey: feedKeys.replies(commentId),
    queryFn: ({ pageParam }) =>
      fetchRepliesPageAction({
        commentId,
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
