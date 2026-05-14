'use client';

import { useEffect, useRef } from 'react';
import type { SessionUser } from '@/features/auth/types';
import { useFeed } from '../hooks/use-feed';
import type { FeedPage } from '../types';
import { PostCard } from './post-card';

// Client-side infinite scroll. The Server Component pre-fetches page 1 and
// passes it as `initialPage` so the first paint is server-rendered and
// hydrates with the cache already warm. Subsequent pages are pulled via
// the Server Action (queryFn) and joined into the cache by useInfiniteQuery.
//
// IntersectionObserver on a sentinel <div> triggers fetchNextPage when the
// user scrolls within ~400px of the list bottom. Cleaner than a "Load more"
// button for a feed; mirrors what Twitter / Facebook do.

interface FeedListProps {
  initialPage: FeedPage;
  currentUser: SessionUser;
}

export function FeedList({ initialPage, currentUser }: FeedListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useFeed({ initialPage });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px 0px 400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'error') {
    return (
      <div role="alert" className="form-server-error">
        Couldn’t load posts: {error.message}
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  if (posts.length === 0) {
    return (
      <p
        className="page-centered__message"
        style={{ marginTop: 32, marginBottom: 32 }}
      >
        No posts yet. Be the first to share something.
      </p>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUser={currentUser} />
      ))}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      {isFetchingNextPage && (
        <div className="skeleton-page" style={{ padding: 24 }}>
          Loading more posts…
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p
          className="page-centered__message"
          style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}
        >
          You’re all caught up.
        </p>
      )}
    </>
  );
}
