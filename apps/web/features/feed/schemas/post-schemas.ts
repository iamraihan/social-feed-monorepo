import { z } from 'zod';

// Mirrors social-feed-api CreatePostDto + multer image rules. Backend re-
// validates everything — these schemas exist so the user gets immediate
// feedback in the browser instead of round-tripping a 400.

export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const postVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export type PostVisibilityInput = z.infer<typeof postVisibilitySchema>;

// File validation is only meaningful in the browser (`File` is a browser
// type). On the server it's a `Blob`-like object; we re-check size/type
// inside the action where it matters.
const imageFileSchema = z
  .instanceof(File)
  .refine(
    (file) => file.size <= MAX_IMAGE_BYTES,
    `Image must be ${MAX_IMAGE_MB} MB or smaller`,
  )
  .refine(
    (file) =>
      (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type),
    'Image must be JPEG, PNG, WebP, or GIF',
  );

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write something before posting')
    .max(5000, 'Post must not exceed 5000 characters'),
  visibility: postVisibilitySchema.default('PUBLIC'),
  image: imageFileSchema.optional(),
});

