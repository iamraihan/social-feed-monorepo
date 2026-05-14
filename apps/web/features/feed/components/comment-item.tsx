'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { SessionUser } from '@/features/auth/types';
import { useCreateReply } from '../hooks/use-create-reply';
import { useDeleteComment } from '../hooks/use-delete-comment';
import { useToggleCommentLike } from '../hooks/use-toggle-comment-like';
import type { Comment, LikeTarget } from '../types';
import { CommentComposer } from './comment-composer';
import { ReplyList } from './reply-list';

// One comment OR reply row. Discriminated by `comment.parentId`:
//   null  → top-level comment (renders Reply + nested ReplyList)
//   set   → reply (no nested replies, no Reply button)
//
// All click-to-react actions feed through the optimistic hooks — the UI flips
// instantly and rolls back on error. Delete is gated to the comment's own
// author (backend enforces it too; this is the UX guard).

interface CommentItemProps {
  comment: Comment;
  currentUser: SessionUser;
  postId: string;
  onShowLikers: (target: LikeTarget, targetId: string, total: number) => void;
}

function timeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export function CommentItem({
  comment,
  currentUser,
  postId,
  onShowLikers,
}: CommentItemProps) {
  const isReply = comment.parentId !== null;
  const target: Extract<LikeTarget, 'comment' | 'reply'> = isReply
    ? 'reply'
    : 'comment';
  const containerId = isReply ? (comment.parentId as string) : postId;

  const toggleLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();
  const createReply = useCreateReply({ postId, parentCommentId: comment.id });

  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwn = comment.author.id === currentUser.id;
  const displayName = `${comment.author.firstName} ${comment.author.lastName}`;
  const hasReplies = !isReply && comment.replyCount > 0;

  function handleLikeClick() {
    toggleLike.mutate({
      target,
      commentId: comment.id,
      containerId,
      currentlyLiked: comment.hasLiked,
    });
  }

  async function handleReplySubmit(content: string) {
    try {
      await createReply.mutateAsync(content);
      setReplyOpen(false);
      setRepliesExpanded(true);
    } catch {
      // Error surfaces via createReply.error and renders inside the composer.
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deleteComment.mutateAsync({
        commentId: comment.id,
        postId,
        parentCommentId: comment.parentId,
      });
      setConfirmOpen(false);
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  }

  return (
    <div className="_comment_main comment-item">
      <div className="_comment_image">
        <Avatar
          src={comment.author.avatarKey}
          alt={displayName}
          name={displayName}
          size={isReply ? 28 : 36}
          className="_comment_img1"
        />
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">{displayName}</h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.content}</span>
            </p>
          </div>

          {comment.likeCount > 0 && (
            <div className="_total_reactions comment-likes-summary">
              <button
                type="button"
                className="btn-reset comment-likes-count"
                onClick={() =>
                  onShowLikers(target, comment.id, comment.likeCount)
                }
                aria-label={`${comment.likeCount} ${
                  comment.likeCount === 1 ? 'person' : 'people'
                } liked this`}
              >
                <span className="_reaction_heart" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#e0245e"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
                <span className="_total">{comment.likeCount}</span>
              </button>
            </div>
          )}

          <div className="_comment_reply">
            <ul className="_comment_reply_list">
              <li>
                <button
                  type="button"
                  className={`btn-reset comment-action ${
                    comment.hasLiked ? 'comment-action-active' : ''
                  }`}
                  onClick={handleLikeClick}
                  disabled={toggleLike.isPending}
                  aria-pressed={comment.hasLiked}
                >
                  {comment.hasLiked ? 'Liked' : 'Like'}
                </button>
              </li>
              {!isReply && (
                <li>
                  <button
                    type="button"
                    className="btn-reset comment-action"
                    onClick={() => setReplyOpen((v) => !v)}
                    aria-expanded={replyOpen}
                  >
                    Reply
                  </button>
                </li>
              )}
              {isOwn && (
                <li>
                  <button
                    type="button"
                    className="btn-reset comment-action comment-action-danger"
                    onClick={() => {
                      setDeleteError(null);
                      setConfirmOpen(true);
                    }}
                    disabled={deleteComment.isPending}
                  >
                    Delete
                  </button>
                </li>
              )}
              <li>
                <span className="_time_link">{timeAgoShort(comment.createdAt)}</span>
              </li>
            </ul>
          </div>

          {hasReplies && (
            <button
              type="button"
              className="btn-reset comment-view-replies"
              onClick={() => setRepliesExpanded((v) => !v)}
              aria-expanded={repliesExpanded}
            >
              {repliesExpanded
                ? 'Hide replies'
                : `View ${comment.replyCount} ${
                    comment.replyCount === 1 ? 'reply' : 'replies'
                  }`}
            </button>
          )}

          {!isReply && repliesExpanded && (
            <ReplyList
              parentCommentId={comment.id}
              postId={postId}
              currentUser={currentUser}
              onShowLikers={onShowLikers}
            />
          )}
        </div>

        {!isReply && replyOpen && (
          <CommentComposer
            currentUser={currentUser}
            onSubmit={handleReplySubmit}
            isPending={createReply.isPending}
            error={createReply.error?.message ?? null}
            placeholder={`Reply to ${comment.author.firstName}…`}
            autoFocus
            variant="reply"
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={isReply ? 'Delete this reply?' : 'Delete this comment?'}
        description={
          <>
            <p>
              {isReply
                ? 'This will permanently remove your reply.'
                : 'This will permanently remove your comment and its replies.'}
            </p>
            {deleteError && (
              <p role="alert" className="form-server-error" style={{ marginTop: 12 }}>
                {deleteError}
              </p>
            )}
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isPending={deleteComment.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
