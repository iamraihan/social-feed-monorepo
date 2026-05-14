import type { Instrumentation } from 'next';
import { logError } from './lib/safe-log';

// Top-level instrumentation entrypoint. Runs once per server process at
// boot — the right hook for setting up tracing (OpenTelemetry), error
// reporting (Sentry / Datadog / etc.), and structured logging.
//
// Today it's a thin scaffold that reports uncaught request errors to
// stderr via `logError` (PII-redacted). Swap in a real logger by editing
// `lib/safe-log.ts` and the SDK init below — all call sites pick it up
// automatically.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // place to init logger / tracing / sentry SDK
  }
}

// Fires for any error that bubbles to the framework boundary — Server
// Components, Server Actions, route handlers, proxy. We log here so even
// errors that the per-segment error.tsx catches are observable.
export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const e = err as Error & { digest?: string };
  logError('[onRequestError]', {
    digest: e.digest,
    name: e.name,
    message: e.message,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
  });
};
