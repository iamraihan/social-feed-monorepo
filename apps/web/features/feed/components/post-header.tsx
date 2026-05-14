'use client';

import { useState, useSyncExternalStore } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Popover } from '@/components/ui/popover';
import { useDeletePost } from '../hooks/use-delete-post';
import type { Post } from '../types';

// Top row of a post — avatar, name, relative time, visibility, 3-dot menu.
// Menu + delete confirmation use shared primitives (Popover + ConfirmDialog)
// so other surfaces (comments, replies, future profile actions) get the
// same affordance without duplicating focus/keyboard plumbing.

interface PostHeaderProps {
  post: Post;
  /** Author of the post can see Delete in the menu. */
  isOwnPost: boolean;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

// Relative-time labels depend on Date.now() and the browser's locale, both
// of which differ from the server. useSyncExternalStore returns false during
// SSR and true after hydration, so we render the stable ISO on the server
// and swap to the relative label on the client without cascading renders.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function PostHeader({ post, isOwnPost }: PostHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePost = useDeletePost();
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const timeLabel = isClient ? timeAgo(post.createdAt) : post.createdAt;

  const displayName = `${post.author.firstName} ${post.author.lastName}`;

  function openConfirm() {
    setMenuOpen(false);
    setDeleteError(null);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deletePost.mutateAsync(post.id);
      // PostCard unmounts as soon as the cache patch removes the row, so the
      // dialog tears down with it. Closing here too just keeps state honest
      // if the parent happens to keep the card mounted.
      setConfirmOpen(false);
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  }

  const trigger = (
    <button
      type="button"
      className="_feed_timeline_post_dropdown_link btn-reset"
      aria-label="Post options"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((v) => !v)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="4"
        height="17"
        fill="none"
        viewBox="0 0 4 17"
      >
        <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
        <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
        <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
      </svg>
    </button>
  );

  return (
    <div className="_feed_inner_timeline_post_top">
      <div className="_feed_inner_timeline_post_box">
        <div className="_feed_inner_timeline_post_box_image">
          <Avatar
            src={post.author.avatarKey}
            alt={displayName}
            name={displayName}
            size={48}
            className="_post_img"
          />
        </div>
        <div className="_feed_inner_timeline_post_box_txt">
          <h4 className="_feed_inner_timeline_post_box_title">{displayName}</h4>
          <p className="_feed_inner_timeline_post_box_para">
            <time dateTime={post.createdAt} suppressHydrationWarning>
              {timeLabel}
            </time>
            {' . '}
            <span>{post.visibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
          </p>
        </div>
      </div>

      {/* The 3-dot menu only renders when the viewer has actions available.
       * For non-owners that means an empty menu — hide entirely instead. */}
      {isOwnPost && (
        <div className="_feed_inner_timeline_post_box_dropdown">
          <Popover
            open={menuOpen}
            onOpenChange={setMenuOpen}
            ariaLabel="Post options"
            trigger={trigger}
            className="_feed_timeline_post_dropdown popover-wrapper"
          >
            <button
              type="button"
              role="menuitem"
              className="popover-item popover-item-danger"
              onClick={openConfirm}
            >
              Delete Post
            </button>
          </Popover>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this post?"
        description={
          <>
            <p>This will permanently remove the post for everyone who can see it.</p>
            {deleteError && (
              <p role="alert" className="form-server-error" style={{ marginTop: 12 }}>
                {deleteError}
              </p>
            )}
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isPending={deletePost.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
