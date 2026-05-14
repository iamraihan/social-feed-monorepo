'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toggleCommentLikeAction } from '../actions/toggle-comment-like-action';
import { feedKeys } from '../lib/feed-keys';
import type { CommentPage, FeedPage, LikeTarget, Post } from '../types';

// Optimistic comment / reply like toggle. The cache update happens BEFORE the
// server call so the icon flips instantly. The "container" is either the
// post's comments cache (for top-level comments) or the parent's replies
// cache (for replies) — both share the CommentPage shape so one patch works
// on either.

type CommentCache = InfiniteData<CommentPage, string | undefined>;
type FeedCache = InfiniteData<FeedPage, string | undefined>;

interface ToggleArgs {
  /** 'comment' for top-level, 'reply' for nested. */
  target: Extract<LikeTarget, 'comment' | 'reply'>;
  commentId: string;
  /** Cache container: post id (for comments) OR parent comment id (for replies). */
  containerId: string;
  currentlyLiked: boolean;
}

function patchLike(
  pages: CommentPage[],
  commentId: string,
  next: boolean,
): CommentPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((c) => {
      if (c.id !== commentId) return c;
      touched = true;
      return {
        ...c,
        hasLiked: next,
        likeCount: Math.max(0, c.likeCount + (next ? 1 : -1)),
      };
    });
    return touched ? { ...page, data } : page;
  });
}

// Same patch shape, but for the preview comment embedded on a Post. Only
// runs when the toggle target is a top-level COMMENT (replies are never
// surfaced as a post's previewComment).
function patchPreviewLike(
  pages: FeedPage[],
  commentId: string,
  next: boolean,
): FeedPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((post) => {
      if (!post.previewComment || post.previewComment.id !== commentId) {
        return post;
      }
      touched = true;
      return {
        ...post,
        previewComment: {
          ...post.previewComment,
          hasLiked: next,
          likeCount: Math.max(
            0,
            post.previewComment.likeCount + (next ? 1 : -1),
          ),
        },
      };
    });
    return touched ? { ...page, data } : page;
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ target, commentId, currentlyLiked }: ToggleArgs) => {
      const result = await toggleCommentLikeAction({
        target,
        commentId,
        liked: !currentlyLiked,
      });
      if (!result.ok) throw new Error(result.error);
      return result;
    },

    onMutate: async ({ target, commentId, containerId, currentlyLiked }) => {
      const key =
        target === 'comment'
          ? feedKeys.comments(containerId)
          : feedKeys.replies(containerId);

      await queryClient.cancelQueries({ queryKey: key });

      const snapshot = queryClient.getQueryData<CommentCache>(key);
      const next = !currentlyLiked;
      if (snapshot) {
        queryClient.setQueryData<CommentCache>(key, {
          ...snapshot,
          pages: patchLike(snapshot.pages, commentId, next),
        });
      }

      // If this is a top-level comment, it may be the preview comment on
      // any cached feed list (or the detail). Patch those too so the
      // collapsed-state preview reflects the toggle instantly.
      type FeedSnapshot = ReturnType<
        typeof queryClient.getQueriesData<FeedCache>
      >;
      let feedSnapshots: FeedSnapshot = [];
      let detailSnapshot: Post | undefined;
      if (target === 'comment') {
        feedSnapshots = queryClient.getQueriesData<FeedCache>({
          queryKey: feedKeys.lists(),
        });
        for (const [feedKey, data] of feedSnapshots) {
          if (!data) continue;
          queryClient.setQueryData<FeedCache>(feedKey, {
            ...data,
            pages: patchPreviewLike(data.pages, commentId, next),
          });
        }

        // `containerId` is the postId for top-level comments — go straight
        // to the matching detail cache.
        const detailKey = feedKeys.detail(containerId);
        detailSnapshot = queryClient.getQueryData<Post>(detailKey);
        if (detailSnapshot?.previewComment?.id === commentId) {
          queryClient.setQueryData<Post>(detailKey, {
            ...detailSnapshot,
            previewComment: {
              ...detailSnapshot.previewComment,
              hasLiked: next,
              likeCount: Math.max(
                0,
                detailSnapshot.previewComment.likeCount + (next ? 1 : -1),
              ),
            },
          });
        }
      }

      return { key, snapshot, feedSnapshots, detailSnapshot, containerId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.snapshot) queryClient.setQueryData(ctx.key, ctx.snapshot);
      for (const [feedKey, data] of ctx.feedSnapshots) {
        queryClient.setQueryData(feedKey, data);
      }
      if (ctx.detailSnapshot) {
        queryClient.setQueryData(
          feedKeys.detail(ctx.containerId),
          ctx.detailSnapshot,
        );
      }
    },

    onSettled: (_data, _err, vars) => {
      // Reconcile the comments/replies cache the optimistic patch touched.
      const containerKey =
        vars.target === 'comment'
          ? feedKeys.comments(vars.containerId)
          : feedKeys.replies(vars.containerId);
      queryClient.invalidateQueries({ queryKey: containerKey });

      // For top-level comments we also patched every cached feed list's
      // `previewComment` (and the detail's). Invalidate those too — without
      // it, a divergent server response (rate-limit, race) would leave the
      // collapsed-state preview stuck on the stale like state forever.
      if (vars.target === 'comment') {
        queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: feedKeys.detail(vars.containerId),
        });
      }
    },
  });
}
