'use client';

import type { SessionUser } from '@/features/auth/types';
import { useComments } from '../hooks/use-comments';
import type { LikeTarget } from '../types';
import { CommentItem } from './comment-item';

// List of top-level comments on a post. Cursor-paginated; "Load more" button
// is the explicit pagination affordance for comments (vs the IntersectionObserver
// on the feed). Conversations are typically shorter than the feed itself,
// and a button is easier to reason about inside a nested scroll context.

interface CommentListProps {
  postId: string;
  currentUser: SessionUser;
  onShowLikers: (target: LikeTarget, targetId: string, total: number) => void;
}

export function CommentList({
  postId,
  currentUser,
  onShowLikers,
}: CommentListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useComments({ postId });

  if (status === 'pending') {
    return <p className="comment-list-status">Loading comments…</p>;
  }

  if (status === 'error') {
    return (
      <p role="alert" className="form-server-error">
        Couldn’t load comments: {error.message}
      </p>
    );
  }

  const comments = data?.pages.flatMap((p) => p.data) ?? [];
  if (comments.length === 0) {
    return (
      <p className="comment-list-empty">No comments yet. Be the first.</p>
    );
  }

  return (
    <div className="_timline_comment_main comment-list">
      {hasNextPage && (
        <div className="_previous_comment">
          <button
            type="button"
            className="_previous_comment_txt btn-reset"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'View previous comments'}
          </button>
        </div>
      )}
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={currentUser}
          postId={postId}
          onShowLikers={onShowLikers}
        />
      ))}
    </div>
  );
}
