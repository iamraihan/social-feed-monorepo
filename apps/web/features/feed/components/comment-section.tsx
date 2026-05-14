'use client';

import type { SessionUser } from '@/features/auth/types';
import { useCreateComment } from '../hooks/use-create-comment';
import type { LikeTarget, Post } from '../types';
import { CommentComposer } from './comment-composer';
import { CommentItem } from './comment-item';
import { CommentList } from './comment-list';

// Per-post comment section. Two visual states, controlled by the parent:
//
//   Collapsed (default):
//     • Composer (always visible)
//     • Preview comment (single, embedded by the backend on the feed query —
//       zero N+1, see PostsService.getPreviewCommentsForPosts)
//     • "View N previous comments" CTA when commentCount > 1
//
//   Expanded (after CTA click, after posting, or after Comment button):
//     • Composer
//     • Full paginated CommentList (its own queryKey, cursor-paginated so a
//       post with 1000 comments never loads them all at once)
//
// `expanded` is controlled by the parent so the Comment button in
// PostReactions can flip the same state without a hidden ref dance. When the
// viewer posts a comment, useCreateComment patches it into post.previewComment
// AND we call onExpandRequest so they see the new comment + the rest of the
// thread instantly.

interface CommentSectionProps {
  post: Post;
  currentUser: SessionUser;
  expanded: boolean;
  onExpandRequest: () => void;
  onShowLikers: (target: LikeTarget, targetId: string, total: number) => void;
}

export function CommentSection({
  post,
  currentUser,
  expanded,
  onExpandRequest,
  onShowLikers,
}: CommentSectionProps) {
  const createComment = useCreateComment(post.id);

  async function handleSubmit(content: string) {
    try {
      await createComment.mutateAsync(content);
      onExpandRequest();
    } catch {
      // createComment.error.message is rendered by the composer.
    }
  }

  // "View N previous comments" only when there's MORE than the single preview
  // already on screen; otherwise the CTA would be a no-op.
  const hasMoreThanPreview = post.commentCount > 1;

  return (
    <div className="_feed_inner_timeline_cooment_area">
      <CommentComposer
        currentUser={currentUser}
        onSubmit={handleSubmit}
        isPending={createComment.isPending}
        error={createComment.error?.message ?? null}
        placeholder="Write a comment"
      />

      {!expanded && (
        <>
          {hasMoreThanPreview && (
            <button
              type="button"
              className="btn-reset comment-section-expand"
              onClick={onExpandRequest}
            >
              View {post.commentCount - 1} previous{' '}
              {post.commentCount - 1 === 1 ? 'comment' : 'comments'}
            </button>
          )}
          {post.previewComment && (
            <div className="_timline_comment_main comment-list">
              <CommentItem
                comment={post.previewComment}
                currentUser={currentUser}
                postId={post.id}
                onShowLikers={onShowLikers}
              />
            </div>
          )}
        </>
      )}

      {expanded && (
        <CommentList
          postId={post.id}
          currentUser={currentUser}
          onShowLikers={onShowLikers}
        />
      )}
    </div>
  );
}
