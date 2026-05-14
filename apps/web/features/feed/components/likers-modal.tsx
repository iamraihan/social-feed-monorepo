'use client';

import { useId } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { useLikers } from '../hooks/use-likers';
import type { LikeTarget } from '../types';

// "Who liked" modal. Triggered by clicking a like count on the post reactions
// strip OR on a comment / reply row. Content-only — portal + backdrop + focus
// + ESC live in the shared Modal primitive.

interface LikersModalProps {
  open: boolean;
  target: LikeTarget;
  targetId: string;
  totalCount: number;
  onClose: () => void;
}

const TARGET_LABEL: Record<LikeTarget, string> = {
  post: 'this post',
  comment: 'this comment',
  reply: 'this reply',
};

export function LikersModal({
  open,
  target,
  targetId,
  totalCount,
  onClose,
}: LikersModalProps) {
  const titleId = useId();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useLikers({ target, targetId, enabled: open });

  const likers = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className="likers-modal"
    >
      <header className="likers-modal-header">
        <h2 id={titleId} className="likers-modal-title">
          {totalCount} {totalCount === 1 ? 'person' : 'people'} liked{' '}
          {TARGET_LABEL[target]}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn-reset likers-modal-close"
        >
          ×
        </button>
      </header>

      <div className="likers-modal-body">
        {status === 'pending' && <p>Loading…</p>}
        {status === 'error' && (
          <p role="alert" className="form-server-error">
            Couldn’t load likers: {error.message}
          </p>
        )}
        {status === 'success' && likers.length === 0 && (
          <p className="likers-modal-empty">No likes yet.</p>
        )}
        {likers.length > 0 && (
          <ul className="likers-modal-list">
            {likers.map((user) => {
              const displayName = `${user.firstName} ${user.lastName}`;
              return (
                <li key={user.id} className="likers-modal-item">
                  <Avatar
                    src={user.avatarKey}
                    alt={displayName}
                    name={displayName}
                    size={40}
                  />
                  <span className="likers-modal-name">{displayName}</span>
                </li>
              );
            })}
          </ul>
        )}
        {hasNextPage && (
          <button
            type="button"
            className="btn-reset likers-modal-more"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </Modal>
  );
}
