'use client';

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { deletePostAction } from '../actions/delete-post-action';
import { feedKeys } from '../lib/feed-keys';
import type { FeedPage, Post } from '../types';

// Optimistic post delete. Removes the row from every cached feed list AND the
// post-detail cache. On error, restores from the snapshot. No revalidatePath
// — keeping invalidation client-side avoids racing a route refresh against
// the confirm-dialog close transition (which previously blanked the screen).

type FeedCache = InfiniteData<FeedPage, string | undefined>;

function removePost(pages: FeedPage[], postId: string): FeedPage[] {
  return pages.map((page) => {
    const data = page.data.filter((p) => p.id !== postId);
    return data.length === page.data.length ? page : { ...page, data };
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await deletePostAction(postId);
      if (!result.ok) throw new Error(result.error);
      return postId;
    },

    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.lists() });

      const feedSnapshots = queryClient.getQueriesData<FeedCache>({
        queryKey: feedKeys.lists(),
      });
      const detailKey = feedKeys.detail(postId);
      const detailSnapshot = queryClient.getQueryData<Post>(detailKey);

      for (const [key, data] of feedSnapshots) {
        if (!data) continue;
        queryClient.setQueryData<FeedCache>(key, {
          ...data,
          pages: removePost(data.pages, postId),
        });
      }
      // Drop the detail cache too — there's no longer a record to render.
      queryClient.removeQueries({ queryKey: detailKey, exact: true });

      return { feedSnapshots, detailSnapshot, postId };
    },

    onError: (_err, _postId, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.feedSnapshots) {
        queryClient.setQueryData(key, data);
      }
      if (ctx.detailSnapshot) {
        queryClient.setQueryData(feedKeys.detail(ctx.postId), ctx.detailSnapshot);
      }
    },
  });
}
