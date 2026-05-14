import 'server-only';
import { authenticatedFetch } from '@/lib/auth-fetch';
import type { FeedMeta, FeedPage, Post } from '../types';

// Server-side wrappers around backend /posts endpoints. Called from Server
// Components, Server Actions, and route handlers — never directly from the
// browser. `authenticatedFetch` handles the Bearer token + refresh-on-401.

const DEFAULT_LIMIT = 20;

export interface FeedQueryParams {
  cursor?: string;
  limit?: number;
}

export async function getFeed(params: FeedQueryParams = {}): Promise<FeedPage> {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  search.set('limit', String(params.limit ?? DEFAULT_LIMIT));

  const { data, meta } = await authenticatedFetch<Post[], FeedMeta>(
    `/posts?${search.toString()}`,
  );

  return {
    data,
    meta: meta ?? {
      hasMore: false,
      nextCursor: null,
      limit: params.limit ?? DEFAULT_LIMIT,
    },
  };
}

export async function getPost(postId: string): Promise<Post> {
  const { data } = await authenticatedFetch<Post>(`/posts/${postId}`);
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  await authenticatedFetch<void>(`/posts/${postId}`, { method: 'DELETE' });
}

interface CreatePostPayload {
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  image?: File | Blob;
}

export async function createPost(input: CreatePostPayload): Promise<Post> {
  const form = new FormData();
  form.set('content', input.content);
  form.set('visibility', input.visibility);
  if (input.image) form.set('image', input.image);

  const { data } = await authenticatedFetch<Post>('/posts', {
    method: 'POST',
    body: form,
  });
  return data;
}
