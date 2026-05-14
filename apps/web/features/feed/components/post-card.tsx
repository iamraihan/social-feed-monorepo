'use client';

import { useState } from 'react';
import { AppImage } from '@/components/ui/app-image';
import type { SessionUser } from '@/features/auth/types';
import { CommentSection } from './comment-section';
import { LikersModal } from './likers-modal';
import { PostHeader } from './post-header';
import { PostReactions } from './post-reactions';
import type { LikeTarget, Post } from '../types';

// _feed_inner_timeline_post_area — orchestrator: header → content → image →
// react stack + buttons → comment section. The comment section is always
// mounted (composer + preview comment match the design's default state).
// `commentsExpanded` flips the section between preview and full paginated
// list — Comment button toggles it. The LikersModal lives here too so one
// portal serves post / comment / reply triggers in this card's tree.

interface PostCardProps {
  post: Post;
  currentUser: SessionUser;
}

interface LikersState {
  target: LikeTarget;
  targetId: string;
  total: number;
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const isOwnPost = post.author.id === currentUser.id;
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [likers, setLikers] = useState<LikersState | null>(null);

  return (
    <article className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <PostHeader post={post} isOwnPost={isOwnPost} />

        <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>

        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <AppImage
              src={post.imageUrl}
              alt=""
              width={700}
              height={420}
              className="_time_img"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}
      </div>

      <PostReactions
        post={post}
        commentsExpanded={commentsExpanded}
        onCommentClick={() => setCommentsExpanded((v) => !v)}
        onShowLikers={(target, targetId, total) =>
          setLikers({ target, targetId, total })
        }
      />

      <div className="_padd_r24 _padd_l24">
        <CommentSection
          post={post}
          currentUser={currentUser}
          expanded={commentsExpanded}
          onExpandRequest={() => setCommentsExpanded(true)}
          onShowLikers={(target, targetId, total) =>
            setLikers({ target, targetId, total })
          }
        />
      </div>

      <LikersModal
        open={likers !== null}
        target={likers?.target ?? 'post'}
        targetId={likers?.targetId ?? post.id}
        totalCount={likers?.total ?? 0}
        onClose={() => setLikers(null)}
      />
    </article>
  );
}
