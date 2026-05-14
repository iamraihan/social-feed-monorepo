'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPostAction,
  type CreatePostActionResult,
} from '../actions/create-post-action';
import { feedKeys } from '../lib/feed-keys';

// Wraps the Server Action in TanStack Query so the calling form gets a
// reactive `isPending` flag, automatic cache invalidation on success, and
// the same error model as other mutations. Form validation stays in RHF;
// this hook owns post-submit side effects only.

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<CreatePostActionResult, Error, FormData>({
    mutationFn: async (formData) => {
      const result = await createPostAction(formData);
      // Convert action-level "ok: false" into a thrown error so the
      // mutation falls through to onError / isError. The error message
      // text is enough for a single form-wide alert; field-level errors
      // are returned in the result for the caller to write to RHF.
      if (!result.ok) {
        const err = new Error(
          result.formError ??
            Object.values(result.fieldErrors ?? {}).flat()[0] ??
            'Could not create post',
        );
        // Stash the structured result on the error so the form can apply
        // field-level errors via RHF's setError.
        (err as Error & { result?: CreatePostActionResult }).result = result;
        throw err;
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate every feed list so the new post appears at the top of
      // page 1 on the next fetch.
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}
