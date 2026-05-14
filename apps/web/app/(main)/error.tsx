'use client';

import { useEffect } from 'react';

// Catches Server Component errors thrown within the (main) segment. MUST be
// a Client Component per Next.js docs. Receives `error` (the caught error)
// and `reset` (re-render the segment after the user clicks Try again).

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Client side — `safe-log` is server-only, so we use console.error here.
    // The same error also flows through `onRequestError` in instrumentation
    // on the server side, where redaction is applied.
    console.error('[app/(main)] render error', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <div role="alert" className="page-centered">
      <h2 className="page-centered__heading">Something went wrong</h2>
      <p className="page-centered__message">
        {error.digest ? `Reference: ${error.digest}` : 'Please try again.'}
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
