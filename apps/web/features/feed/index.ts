// Public API of the `feed` feature.
//
// Server-only modules (api/, actions/) intentionally NOT re-exported here so
// `'use server'` / `'server-only'` markers stay effective for client bundles.
// Import via deep path: `@/features/feed/api/feed-api` or
// `@/features/feed/actions/*-action`. Inner client components (PostCard,
// CommentSection, LikersModal, etc.) are import-by-path too — only the
// page-level entry points sit on this barrel.

export { Stories } from './components/stories';
export { PostComposer } from './components/post-composer';
export { FeedList } from './components/feed-list';
