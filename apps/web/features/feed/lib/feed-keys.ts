import type { LikeTarget } from "../types";

// Centralised TanStack Query keys for the feed feature. Defining keys in a
// single factory beats sprinkling string literals across hooks — typos won't
// silently miss cache hits, and invalidating "everything feed-related"
// becomes a one-liner: queryClient.invalidateQueries({ queryKey: feedKeys.all }).

export const feedKeys = {
  all: ["feed"] as const,
  lists: () => [...feedKeys.all, "list"] as const,
  list: (filters: { limit?: number } = {}) =>
    [...feedKeys.lists(), filters] as const,
  details: () => [...feedKeys.all, "detail"] as const,
  detail: (postId: string) => [...feedKeys.details(), postId] as const,
  comments: (postId: string) => [...feedKeys.all, "comments", postId] as const,
  replies: (commentId: string) =>
    [...feedKeys.all, "replies", commentId] as const,
  likers: (target: LikeTarget, targetId: string) =>
    [...feedKeys.all, "likers", target, targetId] as const,
};
