import "server-only";
import { ApiClientError, apiRequest } from "./api-client";
import { getAccessToken } from "@/features/auth/lib/session";

// Authenticated server-side fetch. Attaches the access_token cookie as a
// Bearer header. Does NOT attempt refresh on 401 — that's the proxy's job.
//
// Why no refresh here:
//   - Server Components cannot modify cookies in Next.js; the rotated
//     refresh_token would be lost and the user would be locked out.
//   - Server Actions can modify cookies in principle, but routing the
//     refresh logic through two layers (proxy + action) creates race
//     windows where both refresh simultaneously and one rotation wins.
//   - The proxy refreshes pre-emptively when access_token is missing, so
//     by the time any auth'd fetch runs, the token is fresh.
//
// What happens on 401: the error bubbles up. Server Components / Actions
// catch it and redirect to /login (the access_token was revoked
// mid-session — rare, but a fresh login is the only safe recovery).

export async function authenticatedFetch<TData, TMeta = unknown>(
  path: string,
  options: Parameters<typeof apiRequest>[1] = {},
): ReturnType<typeof apiRequest<TData, TMeta>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    // Defensive: proxy should have already refreshed or redirected. If we
    // get here, the cookie was cleared mid-request — fail closed.
    throw new ApiClientError({
      code: "UNAUTHORIZED",
      message: "No access token. Please log in again.",
      status: 401,
    });
  }
  return apiRequest<TData, TMeta>(path, {
    ...options,
    accessToken,
  });
}
