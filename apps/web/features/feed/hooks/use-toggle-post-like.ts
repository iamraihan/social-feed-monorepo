'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { togglePostLikeAction } from '../actions/toggle-post-like-action';
import { feedKeys } from '../lib/feed-keys';
import type { FeedPage, Post } from '../types';

// Optimistic like-toggle. The cache update happens BEFORE the server call so
// the heart fills/empties instantly. On error we rollback to the snapshot
// captured in onMutate. onSettled refetches the affected query to reconcile
// with whatever the server actually committed (e.g., a stale like state).

interface ToggleLikeArgs {
  postId: string;
  /** Current `hasLiked` state — we flip it. */
  currentlyLiked: boolean;
}

type FeedCache = InfiniteData<FeedPage, string | undefined>;

function patchPostInPages(
  pages: FeedPage[],
  postId: string,
  next: boolean,
): FeedPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((post) => {
      if (post.id !== postId) return post;
      touched = true;
      return {
        ...post,
        hasLiked: next,
        likeCount: Math.max(0, post.likeCount + (next ? 1 : -1)),
      };
    });
    return touched ? { ...page, data } : page;
  });
}

export function useTogglePostLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, currentlyLiked }: ToggleLikeArgs) => {
      const result = await togglePostLikeAction({
        postId,
        liked: !currentlyLiked,
      });
      if (!result.ok) throw new Error(result.error);
      return result;
    },

    onMutate: async ({ postId, currentlyLiked }) => {
      // Cancel any outgoing refetches that might overwrite our optimistic
      // update before the mutation resolves.
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      // Snapshot every feed-list cache so rollback is exhaustive.
      const snapshots = queryClient.getQueriesData<FeedCache>({
        queryKey: feedKeys.lists(),
      });

      const next = !currentlyLiked;
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<FeedCache>(key, {
          ...data,
          pages: patchPostInPages(data.pages, postId, next),
        });
      }

      // Also patch the single-post cache if anyone has it open.
      const detailKey = feedKeys.detail(postId);
      const previousDetail = queryClient.getQueryData<Post>(detailKey);
      if (previousDetail) {
        queryClient.setQueryData<Post>(detailKey, {
          ...previousDetail,
          hasLiked: next,
          likeCount: Math.max(0, previousDetail.likeCount + (next ? 1 : -1)),
        });
      }

      return { snapshots, previousDetail, postId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.snapshots) {
        queryClient.setQueryData(key, data);
      }
      if (ctx.previousDetail) {
        queryClient.setQueryData(feedKeys.detail(ctx.postId), ctx.previousDetail);
      }
    },

    onSettled: (_data, _err, vars) => {
      // Reconcile with server truth (handles edge cases like a stale token,
      // a backend-side throttle, or another tab racing the same toggle).
      // The feed list response embeds `topLikers` per post, so refetching
      // the list also refreshes the small stacked-avatars summary.
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(vars.postId) });
    },
  });
}
