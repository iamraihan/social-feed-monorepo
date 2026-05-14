'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { createCommentAction } from '../actions/create-comment-action';
import { feedKeys } from '../lib/feed-keys';
import type {
  Comment,
  CommentPage,
  FeedPage,
  Post,
} from '../types';

// Mutation hook for the post-level comment composer. On success it prepends
// the new comment to the cached first page so it shows up instantly without
// waiting for a refetch, and bumps `commentCount` on the parent post across
// every cached feed list + the detail cache.

type FeedCache = InfiniteData<FeedPage, string | undefined>;
type CommentCache = InfiniteData<CommentPage, string | undefined>;

function bumpPostCommentCount(
  pages: FeedPage[],
  postId: string,
  delta: number,
  newPreview?: Comment,
): FeedPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((post) => {
      if (post.id !== postId) return post;
      touched = true;
      return {
        ...post,
        commentCount: Math.max(0, post.commentCount + delta),
        // Replace the preview with the just-posted comment so the user sees
        // their message inline even when the section is collapsed.
        previewComment: newPreview ?? post.previewComment,
      };
    });
    return touched ? { ...page, data } : page;
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const result = await createCommentAction({ postId, content });
      if (!result.ok) {
        // Surface field/form errors via a thrown Error — the composer reads
        // mutation.error.message and can also pull fieldErrors off the result
        // if we widen the throw. For now content is the only field.
        const message =
          result.fieldErrors?.content?.[0] ??
          result.formError ??
          'Could not post comment. Try again.';
        throw new Error(message);
      }
      return result.comment;
    },

    onSuccess: (newComment: Comment) => {
      // Prepend the new comment to the cached first page so it shows up
      // without a refetch. If the cache is empty (user hasn't opened the
      // section yet) we no-op — the next useComments fetch will load it
      // from the server.
      queryClient.setQueryData<CommentCache>(
        feedKeys.comments(postId),
        (cache) => {
          if (!cache || cache.pages.length === 0) return cache;
          const [first, ...rest] = cache.pages;
          return {
            ...cache,
            pages: [
              { ...first, data: [newComment, ...first.data] },
              ...rest,
            ],
          };
        },
      );

      // Bump commentCount + refresh previewComment everywhere the post is
      // rendered. The new comment is by definition the most-recent, so it
      // becomes the preview.
      for (const [key, data] of queryClient.getQueriesData<FeedCache>({
        queryKey: feedKeys.lists(),
      })) {
        if (!data) continue;
        queryClient.setQueryData<FeedCache>(key, {
          ...data,
          pages: bumpPostCommentCount(data.pages, postId, 1, newComment),
        });
      }

      const detailKey = feedKeys.detail(postId);
      const detail = queryClient.getQueryData<Post>(detailKey);
      if (detail) {
        queryClient.setQueryData<Post>(detailKey, {
          ...detail,
          commentCount: detail.commentCount + 1,
          previewComment: newComment,
        });
      }
    },

    // Reconcile with server truth — the optimistic prepend uses the row the
    // action returned, which is already server-authoritative, BUT if anything
    // else triggers a refetch of page 0 (window focus, other tab posting),
    // without invalidation the optimistic row would briefly duplicate the
    // refetched one. A targeted invalidate is the simplest guarantee.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) });
    },
  });
}
