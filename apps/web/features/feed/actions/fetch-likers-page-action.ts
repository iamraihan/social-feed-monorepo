'use server';

import { requireSession } from '@/features/auth/lib/session';
import { listLikers, type LikersQueryParams } from '../api/likes-api';
import type { LikerPage, LikeTarget } from '../types';

// queryFn target for the "who liked" modal. Backend route is polymorphic
// (POST / COMMENT / REPLY) so a single action covers all three.

export async function fetchLikersPageAction(input: {
  target: LikeTarget;
  targetId: string;
  params?: LikersQueryParams;
}): Promise<LikerPage> {
  await requireSession();
  return listLikers(input.target, input.targetId, input.params);
}
