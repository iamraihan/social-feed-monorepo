'use client';

import { Avatar } from '@/components/ui/avatar';
import { useTogglePostLike } from '../hooks/use-toggle-post-like';
import type { LikeTarget, Post } from '../types';

// Post reactions block. Mirrors the design's two-row layout:
//
//   ┌───────────────────────────────────────────────────────────────┐
//   │ [A1][A2][A3] 9+              12 Comment    122 Share          │  ← summary row
//   ├───────────────────────────────────────────────────────────────┤
//   │ [♥ Liked]    [💬 Comment]    [📤 Share]                       │  ← action row
//   └───────────────────────────────────────────────────────────────┘
//
// `topLikers` ships embedded in the feed response (backend window-function
// query) — zero extra round-trips per card. Clicking the like count opens
// the LikersModal owned by PostCard (callback `onShowLikers`).

const STACK_SIZE = 24;

interface PostReactionsProps {
  post: Post;
  /** Toggles the comment section open/closed (sibling of this component). */
  onCommentClick: () => void;
  commentsExpanded: boolean;
  onShowLikers: (target: LikeTarget, targetId: string, total: number) => void;
}

/** Compact count: 1, 2, …, 9, then 9+ for 10 and above. Matches the design. */
function formatCompactCount(n: number): string {
  if (n > 9) return '9+';
  return String(n);
}

export function PostReactions({
  post,
  onCommentClick,
  commentsExpanded,
  onShowLikers,
}: PostReactionsProps) {
  const { mutate: toggleLike, isPending } = useTogglePostLike();

  const handleLikeClick = () => {
    toggleLike({ postId: post.id, currentlyLiked: post.hasLiked });
  };

  const commentCount = post.commentCount;
  const shareCount = post.shareCount ?? 0;

  return (
    <>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {post.likeCount > 0 ? (
            <button
              type="button"
              className="btn-reset liker-summary-button"
              onClick={() => onShowLikers('post', post.id, post.likeCount)}
              aria-label={`See who liked this post (${post.likeCount})`}
            >
              {post.topLikers.length > 0 && (
                <span className="liker-stack" aria-hidden="true">
                  {post.topLikers.map((user) => (
                    <Avatar
                      key={user.id}
                      src={user.avatarKey}
                      alt=""
                      name={`${user.firstName} ${user.lastName}`}
                      size={STACK_SIZE}
                    />
                  ))}
                </span>
              )}
              <span className="liker-count-badge">
                {formatCompactCount(post.likeCount)}
              </span>
            </button>
          ) : (
            <span className="liker-count-empty">Be the first to like</span>
          )}
        </div>

        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button
              type="button"
              className="btn-reset"
              onClick={onCommentClick}
              aria-expanded={commentsExpanded}
            >
              <span>{commentCount}</span> Comment
            </button>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <span>{shareCount}</span> Share
          </p>
        </div>
      </div>

      <div className="_feed_inner_timeline_reaction">
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isPending}
          aria-pressed={post.hasLiked}
          aria-label={post.hasLiked ? 'Unlike post' : 'Like post'}
          className={
            post.hasLiked
              ? '_feed_inner_timeline_reaction_emoji _feed_reaction _feed_reaction_active btn-reset'
              : '_feed_inner_timeline_reaction_emoji _feed_reaction btn-reset'
          }
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              {post.hasLiked ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e0245e">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
              {post.hasLiked ? 'Liked' : 'Like'}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onCommentClick}
          aria-expanded={commentsExpanded}
          className="_feed_inner_timeline_reaction_comment _feed_reaction btn-reset"
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                className="_reaction_svg"
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                fill="none"
                viewBox="0 0 21 21"
              >
                <path
                  stroke="#000"
                  d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"
                />
                <path
                  stroke="#000"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.938 9.313h7.125M10.5 14.063h3.563"
                />
              </svg>
              Comment
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          aria-disabled="true"
          className="_feed_inner_timeline_reaction_share _feed_reaction btn-reset"
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                className="_reaction_svg"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="21"
                fill="none"
                viewBox="0 0 24 21"
              >
                <path
                  stroke="#000"
                  strokeLinejoin="round"
                  d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z"
                />
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>
    </>
  );
}
