'use client';

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ActionResult } from '../types';

// Fan out a server-action's field+form errors into RHF's setError. Called
// synchronously after `await someAction(data)` inside the form's onSubmit,
// so errors appear without the useEffect / state-sync flicker that older
// useActionState patterns suffered from.

export function applyServerErrors<T extends FieldValues>(
  result: Extract<ActionResult<string>, { ok: false }>,
  setError: UseFormSetError<T>,
): void {
  if (result.fieldErrors) {
    for (const [name, messages] of Object.entries(result.fieldErrors)) {
      const message = messages?.[0];
      if (message) {
        setError(name as Path<T>, { type: 'server', message });
      }
    }
  }
  if (result.formError) {
    setError('root.serverError' as Path<T>, {
      type: 'server',
      message: result.formError,
    });
  }
}
