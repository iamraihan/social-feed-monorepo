'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { deleteCommentAction } from '../actions/delete-comment-action';
import { feedKeys } from '../lib/feed-keys';
import type {
  CommentPage,
  FeedPage,
  Post,
} from '../types';

// Optimistic delete: remove the row from its cache (comments or replies
// depending on `parentId`) and decrement the parent's count (post.commentCount
// or comment.replyCount). On error, restore the snapshot.

type FeedCache = InfiniteData<FeedPage, string | undefined>;
type CommentCache = InfiniteData<CommentPage, string | undefined>;

interface DeleteVariables {
  commentId: string;
  postId: string;
  /** Null = top-level comment, non-null = reply. */
  parentCommentId: string | null;
}

function removeFromPages(
  pages: CommentPage[],
  commentId: string,
): { pages: CommentPage[]; removed: boolean } {
  let removed = false;
  const next = pages.map((page) => {
    const filtered = page.data.filter((c) => {
      if (c.id !== commentId) return true;
      removed = true;
      return false;
    });
    return filtered.length === page.data.length
      ? page
      : { ...page, data: filtered };
  });
  return { pages: next, removed };
}

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

function bumpPostCommentCount(
  pages: FeedPage[],
  postId: string,
  delta: number,
  /** If set, clear post.previewComment when its id matches. */
  clearPreviewIfId?: string,
): FeedPage[] {
  return pages.map((page) => {
    let touched = false;
    const data = page.data.map((post) => {
      if (post.id !== postId) return post;
      touched = true;
      const nextPreview =
        clearPreviewIfId && post.previewComment?.id === clearPreviewIfId
          ? null
          : post.previewComment;
      return {
        ...post,
        commentCount: Math.max(0, post.commentCount + delta),
        previewComment: nextPreview,
      };
    });
    return touched ? { ...page, data } : page;
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: DeleteVariables) => {
      const result = await deleteCommentAction(vars.commentId);
      if (!result.ok) throw new Error(result.error);
      return vars;
    },

    onMutate: async (vars) => {
      const isReply = vars.parentCommentId !== null;
      const containerKey = isReply
        ? feedKeys.replies(vars.parentCommentId as string)
        : feedKeys.comments(vars.postId);

      await queryClient.cancelQueries({ queryKey: containerKey });

      // Snapshot the container cache (replies or comments) so we can rollback.
      const containerSnapshot =
        queryClient.getQueryData<CommentCache>(containerKey);
      const feedSnapshots = isReply
        ? []
        : queryClient.getQueriesData<FeedCache>({ queryKey: feedKeys.lists() });
      const detailSnapshot = isReply
        ? undefined
        : queryClient.getQueryData<Post>(feedKeys.detail(vars.postId));
      const commentsSnapshot = isReply
        ? queryClient.getQueryData<CommentCache>(
            feedKeys.comments(vars.postId),
          )
        : undefined;

      // Optimistic removal from the container.
      if (containerSnapshot) {
        const { pages } = removeFromPages(
          containerSnapshot.pages,
          vars.commentId,
        );
        queryClient.setQueryData<CommentCache>(containerKey, {
          ...containerSnapshot,
          pages,
        });
      }

      // Counter adjustments depending on what we deleted.
      if (isReply && commentsSnapshot) {
        queryClient.setQueryData<CommentCache>(feedKeys.comments(vars.postId), {
          ...commentsSnapshot,
          pages: bumpReplyCount(
            commentsSnapshot.pages,
            vars.parentCommentId as string,
            -1,
          ),
        });
      }
      if (!isReply) {
        for (const [key, data] of feedSnapshots) {
          if (!data) continue;
          queryClient.setQueryData<FeedCache>(key, {
            ...data,
            pages: bumpPostCommentCount(
              data.pages,
              vars.postId,
              -1,
              vars.commentId,
            ),
          });
        }
        if (detailSnapshot) {
          const nextPreview =
            detailSnapshot.previewComment?.id === vars.commentId
              ? null
              : detailSnapshot.previewComment;
          queryClient.setQueryData<Post>(feedKeys.detail(vars.postId), {
            ...detailSnapshot,
            commentCount: Math.max(0, detailSnapshot.commentCount - 1),
            previewComment: nextPreview,
          });
        }
      }

      return {
        containerKey,
        containerSnapshot,
        feedSnapshots,
        detailSnapshot,
        commentsSnapshot,
        vars,
      };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.containerSnapshot) {
        queryClient.setQueryData(ctx.containerKey, ctx.containerSnapshot);
      }
      for (const [key, data] of ctx.feedSnapshots) {
        queryClient.setQueryData(key, data);
      }
      if (ctx.detailSnapshot) {
        queryClient.setQueryData(
          feedKeys.detail(ctx.vars.postId),
          ctx.detailSnapshot,
        );
      }
      if (ctx.commentsSnapshot) {
        queryClient.setQueryData(
          feedKeys.comments(ctx.vars.postId),
          ctx.commentsSnapshot,
        );
      }
    },
  });
}
