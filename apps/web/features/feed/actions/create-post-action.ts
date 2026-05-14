"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiClientError } from "@/lib/api-client";
import { logError } from "@/lib/safe-log";
import { requireSession } from "@/features/auth/lib/session";
import { createPost } from "../api/feed-api";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "../schemas/post-schemas";
import type { Post } from "../types";

// Server Action takes FormData rather than a typed object because images
// are Files — FormData is the only round-trip mechanism that avoids base64
// inflation. We still return typed errors via the result envelope.

type CreatePostField = "content" | "visibility" | "image";

export type CreatePostActionResult =
  | { ok: true; post: Post }
  | {
      ok: false;
      fieldErrors?: Partial<Record<CreatePostField, string[]>>;
      formError?: string;
    };

const serverSideSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write something before posting")
    .max(5000, "Post must not exceed 5000 characters"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export async function createPostAction(
  formData: FormData,
): Promise<CreatePostActionResult> {
  // Public Server Action endpoint — anyone can POST. Proxy gate is not a
  // substitute for an in-action auth check.
  await requireSession();

  const parsed = serverSideSchema.safeParse({
    content: formData.get("content"),
    visibility: formData.get("visibility") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Re-validate image size/type at the server boundary. Client-side
  // validation is for UX; never trust it for security limits.
  const imageEntry = formData.get("image");
  let image: File | undefined;
  if (imageEntry instanceof File && imageEntry.size > 0) {
    if (imageEntry.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        fieldErrors: { image: [`Image must be ${MAX_IMAGE_MB} MB or smaller`] },
      };
    }
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(imageEntry.type)) {
      return {
        ok: false,
        fieldErrors: { image: ["Image must be JPEG, PNG, WebP, or GIF"] },
      };
    }
    image = imageEntry;
  }

  try {
    const post = await createPost({
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      image,
    });
    // Next-render SSR sees the new post; client-side cache invalidation
    // happens via TanStack Query in the calling component.
    revalidatePath("/");
    return { ok: true, post };
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === "PAYLOAD_TOO_LARGE") {
        return {
          ok: false,
          fieldErrors: {
            image: [`Image must be ${MAX_IMAGE_MB} MB or smaller`],
          },
        };
      }
      if (err.code === "UNSUPPORTED_MEDIA_TYPE") {
        return {
          ok: false,
          fieldErrors: { image: ["That file type is not allowed"] },
        };
      }
      if (err.code === "TOO_MANY_REQUESTS") {
        return {
          ok: false,
          formError: "You’re posting too quickly. Please slow down.",
        };
      }
      if (err.code === "VALIDATION_FAILED") {
        return { ok: false, formError: err.details?.[0] ?? err.message };
      }
      logError("[feed/create] backend error", {
        code: err.code,
        status: err.status,
      });
      return { ok: false, formError: err.message };
    }
    logError("[feed/create] unexpected error", {
      message: (err as Error).message,
    });
    return { ok: false, formError: "Something went wrong. Try again." };
  }
}
