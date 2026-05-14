'use client';

import type { SessionUser } from '@/features/auth/types';
import { useReplies } from '../hooks/use-replies';
import type { LikeTarget } from '../types';
import { CommentItem } from './comment-item';

// Lazy-loaded list of replies under a top-level comment. Mounted by
// CommentItem only when the user clicks "View N replies", so the network
// trip is gated behind explicit user intent — feeds with hundreds of
// comments don't pay for replies the user never opened.

interface ReplyListProps {
  parentCommentId: string;
  postId: string;
  currentUser: SessionUser;
  onShowLikers: (target: LikeTarget, targetId: string, total: number) => void;
}

export function ReplyList({
  parentCommentId,
  postId,
  currentUser,
  onShowLikers,
}: ReplyListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useReplies({ commentId: parentCommentId, enabled: true });

  if (status === 'pending') {
    return <p className="reply-list-status">Loading replies…</p>;
  }

  if (status === 'error') {
    return (
      <p role="alert" className="form-server-error">
        Couldn’t load replies: {error.message}
      </p>
    );
  }

  const replies = data?.pages.flatMap((p) => p.data) ?? [];
  if (replies.length === 0) return null;

  return (
    <div className="reply-list">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUser={currentUser}
          postId={postId}
          onShowLikers={onShowLikers}
        />
      ))}
      {hasNextPage && (
        <button
          type="button"
          className="btn-reset reply-list-more"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more replies'}
        </button>
      )}
    </div>
  );
}
