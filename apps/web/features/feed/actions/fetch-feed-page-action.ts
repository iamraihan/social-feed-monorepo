'use server';

import { requireSession } from '@/features/auth/lib/session';
import { getFeed, type FeedQueryParams } from '../api/feed-api';
import type { FeedPage } from '../types';

// Server Action invoked from the browser by TanStack Query's queryFn for
// paginated reads. Going through a Server Action (rather than exposing the
// backend directly via a Next.js route handler) keeps the access cookie +
// refresh logic server-side; the browser never sees a token.

export async function fetchFeedPageAction(
  params: FeedQueryParams = {},
): Promise<FeedPage> {
  await requireSession();
  return getFeed(params);
}
