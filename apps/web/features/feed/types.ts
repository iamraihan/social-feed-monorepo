// Feed-domain types. Mirrors backend PostDto / CommentDto shapes.

import type { PublicUser } from '@/features/users/types';

export type PostVisibility = 'PUBLIC' | 'PRIVATE';

export interface Post {
  id: string;
  content: string;
  imageKey: string | null;
  imageUrl: string | null;
  visibility: PostVisibility;
  author: PublicUser;
  likeCount: number;
  hasLiked: boolean;
  /**
   * Up to 3 most recent likers, embedded by the backend in a single window-
   * function query — eliminates the per-card N+1 we used to do via
   * `usePostLikers`. Empty array when no one has liked yet.
   */
  topLikers: PublicUser[];
  /**
   * Top-level comments on the post (replies excluded). Embedded by the
   * backend via a Prisma `_count` subquery on the comments relation — no
   * extra round-trip per card.
   */
  commentCount: number;
  /**
   * Most-recent top-level comment, embedded by the backend so the feed shows
   * a single preview comment per card without a follow-up fetch. Null when
   * the post has no comments yet. When the user expands the section, the
   * full paginated list (GET /posts/:id/comments) takes over.
   */
  previewComment: Comment | null;
  /** Share feature is a follow-up branch — defaulted to 0 in the UI today. */
  shareCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Mirrors social-feed-api CommentDto. `parentId` discriminates:
//   null     → top-level comment
//   non-null → reply (parentId points at the parent comment)
export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  author: PublicUser;
  /** Replies under this comment. Always 0 for replies in our 1-level model. */
  replyCount: number;
  likeCount: number;
  hasLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPageMeta {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export interface CommentPage {
  data: Comment[];
  meta: CommentPageMeta;
}

export interface LikerPageMeta extends CommentPageMeta {
  total: number;
}

export interface LikerPage {
  data: PublicUser[];
  meta: LikerPageMeta;
}

export type LikeTarget = 'post' | 'comment' | 'reply';

export interface Story {
  id: string;
  name: string;
  imageKey: string;
  miniImageKey: string;
}

export interface FeedMeta {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export interface FeedPage {
  data: Post[];
  meta: FeedMeta;
}
