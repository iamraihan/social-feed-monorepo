import { z } from 'zod';

// Mirrors social-feed-api CreateCommentDto: trim → min 1 → max 2000. Used by
// the comment composer (browser) and the create/reply Server Actions (server)
// so validation rules live in one place. Backend re-validates regardless.

export const MAX_COMMENT_LENGTH = 2000;

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write something before posting')
    .max(
      MAX_COMMENT_LENGTH,
      `Comment must not exceed ${MAX_COMMENT_LENGTH} characters`,
    ),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
