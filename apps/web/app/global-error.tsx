'use client';

import { useEffect } from 'react';

// Last-resort boundary — only triggers when the root layout itself crashes
// (otherwise (main)/error.tsx or (auth)/error.tsx would catch). Must
// include its own <html> and <body> since it replaces the root layout
// entirely, including any global stylesheet.

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Client side — see (main)/error.tsx comment.
    console.error('[global-error]', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div role="alert" className="page-centered">
          <h1 className="page-centered__heading">Application error</h1>
          <p className="page-centered__message">
            A critical error occurred. Try refreshing the page.
          </p>
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
