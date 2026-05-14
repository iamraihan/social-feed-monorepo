'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { createReplyAction } from '../actions/create-reply-action';
import { feedKeys } from '../lib/feed-keys';
import type { Comment, CommentPage } from '../types';

// Reply mutation: prepends the new reply to the parent comment's replies
// cache and bumps the parent's `replyCount` in the comments cache. The
// "postId" is required so we can find the parent in the comments cache
// without a separate lookup.

type CommentCache = InfiniteData<CommentPage, string | undefined>;

function bumpReplyCount(
  pages: CommentPage[],
  commentId: string,
  delta: number,
): CommentPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((c) => {
      if (c.id !== commentId) return c;
      touched = true;
      return { ...c, replyCount: Math.max(0, c.replyCount + delta) };
    });
    return touched ? { ...page, data } : page;
  });
}

interface UseCreateReplyArgs {
  postId: string;
  parentCommentId: string;
}

export function useCreateReply({ postId, parentCommentId }: UseCreateReplyArgs) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const result = await createReplyAction({ parentCommentId, content });
      if (!result.ok) {
        const message =
          result.fieldErrors?.content?.[0] ??
          result.formError ??
          'Could not post reply. Try again.';
        throw new Error(message);
      }
      return result.reply;
    },

    onSuccess: (newReply: Comment) => {
      // Prepend to the replies cache if it's been initialised (user expanded
      // the replies). Otherwise the next useReplies fetch picks it up.
      queryClient.setQueryData<CommentCache>(
        feedKeys.replies(parentCommentId),
        (cache) => {
          if (!cache || cache.pages.length === 0) return cache;
          const [first, ...rest] = cache.pages;
          return {
            ...cache,
            pages: [
              { ...first, data: [newReply, ...first.data] },
              ...rest,
            ],
          };
        },
      );

      // Bump the parent comment's replyCount in the post's comments cache.
      queryClient.setQueryData<CommentCache>(
        feedKeys.comments(postId),
        (cache) => {
          if (!cache) return cache;
          return { ...cache, pages: bumpReplyCount(cache.pages, parentCommentId, 1) };
        },
      );
    },
  });
}
