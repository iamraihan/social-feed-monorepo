'use client';

import { type ReactNode, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Single QueryClient per browser tab; never share one across React rerenders.
// On the server side every request needs a fresh client (sharing would leak
// data between users). The `isServer` branch is Next.js' canonical pattern.

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server-state, not local UI state: pretend it's fresh for 30s so
        // navigating back to the feed doesn't trigger a refetch immediately.
        // The cache-vs-freshness trade-off is per-query — feed pages can
        // override via `staleTime` when listing.
        staleTime: 30_000,
        // Don't refetch on window focus by default — too noisy for a social
        // feed (every alt-tab is a refetch). Reach for it explicitly on
        // queries that genuinely benefit (notifications, presence).
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry 4xx — the user's input is what's wrong, retrying
          // won't fix it. 5xx and network errors get up to 2 retries with
          // TQ's default exponential backoff.
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // Mutations never retry by default — re-submitting a "create post"
        // would duplicate the row server-side. Caller can opt in per-call.
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (isServer) {
    // Server: brand new client per request so cache never crosses users.
    return makeQueryClient();
  }
  // Browser: lazy-singleton, survives Fast Refresh.
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState ensures the QueryClient is stable across rerenders without
  // recreating on every render (which would discard the cache).
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
