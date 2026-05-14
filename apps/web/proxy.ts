import { NextResponse, type NextRequest } from 'next/server';

// Route-protection + pre-emptive token refresh (renamed from `middleware`
// in Next.js 16). Runs on the edge before any Server Component renders.
//
// Why we gate on `refresh_token` (httpOnly) and NOT `session_user`:
//   - `refresh_token` is httpOnly — only the backend can mint it; client
//     JS / XSS cannot forge one.
//   - `session_user` is intentionally non-httpOnly so Client Components can
//     read it for UX. Trusting it at the proxy edge would let any XSS
//     write document.cookie and bypass auth entirely.
//
// Why we refresh here and not in Server Components:
//   - Next.js forbids cookie writes from Server Components. They can read,
//     but `cookies().set()` throws.
//   - The backend's refresh_token is one-time use — calling /auth/refresh
//     rotates the value. If we call it from a Server Component, the
//     rotated token can't be persisted to the browser, and the user is
//     locked out forever.
//   - The proxy CAN write cookies on the response, so it's the only safe
//     place to refresh before render.
//
// IMPORTANT: this runs on the Edge runtime. Do NOT import any module that
// uses Node-only APIs or carries `'server-only'`. Stick to fetch and
// NextResponse cookies APIs.

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const SESSION_USER_COOKIE = 'session_user';
const AUTH_PATHS = new Set<string>(['/login', '/register']);
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

interface RefreshResult {
  accessToken: string;
  expiresIn: number;
  newRefreshToken: string;
}

async function tryRefresh(refreshToken: string): Promise<RefreshResult | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error('[proxy] tryRefresh: API_URL env is not set');
    return null;
  }
  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
    });
    if (!res.ok) {
      console.error('[proxy] tryRefresh: backend returned non-OK', {
        status: res.status,
      });
      return null;
    }

    const body = (await res.json()) as
      | { success: true; data: { accessToken: string; expiresIn: number } }
      | { success: false };
    if (!body.success) {
      console.error('[proxy] tryRefresh: backend body.success=false');
      return null;
    }

    const newRefreshToken = extractRefreshCookieFromSetCookie(
      res.headers.getSetCookie(),
    );
    if (!newRefreshToken) {
      console.error(
        '[proxy] tryRefresh: backend response missing refresh_token Set-Cookie',
      );
      return null;
    }

    return {
      accessToken: body.data.accessToken,
      expiresIn: body.data.expiresIn,
      newRefreshToken,
    };
  } catch (err) {
    console.error('[proxy] tryRefresh: fetch threw', {
      message: (err as Error).message,
    });
    return null;
  }
}

function extractRefreshCookieFromSetCookie(
  setCookies: string[],
): string | undefined {
  for (const header of setCookies) {
    const [pair] = header.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    if (pair.slice(0, eq) === REFRESH_COOKIE) {
      const raw = pair.slice(eq + 1);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
}

function commonCookieOpts() {
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };
}

function setRefreshedCookies(
  response: NextResponse,
  tokens: RefreshResult,
): void {
  const base = commonCookieOpts();
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.newRefreshToken, {
    ...base,
    maxAge: REFRESH_TTL_SECONDS,
  });
}

function buildLogoutResponse(req: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/login', req.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(SESSION_USER_COOKIE);
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;

  if (AUTH_PATHS.has(pathname)) {
    return refreshToken
      ? NextResponse.redirect(new URL('/', req.url))
      : NextResponse.next();
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Pre-emptive refresh path: the access_token cookie expired in the
  // browser (15 min TTL) but the refresh_token is still alive. Mint a
  // fresh access cookie before any Server Component can hit the backend
  // with a missing/expired Bearer.
  //
  // Strategy: refresh, set cookies on the response, redirect to the same
  // URL. The browser follows the redirect with the new cookies attached,
  // so the second request's Server Components see fresh tokens. Adds one
  // round-trip per token expiry (~once per 15 min idle); negligible.
  if (!accessToken) {
    console.log('[proxy] access_token missing — attempting refresh', {
      path: pathname,
    });
    const refreshed = await tryRefresh(refreshToken);
    if (!refreshed) {
      console.warn('[proxy] refresh failed — clearing session, redirect /login');
      return buildLogoutResponse(req);
    }
    console.log('[proxy] refresh succeeded — setting cookies, redirect same URL');
    const response = NextResponse.redirect(req.nextUrl);
    setRefreshedCookies(response, refreshed);
    return response;
  }

  return NextResponse.next();
}

// Skip Next.js internals, public assets, backend uploads, and API routes —
// only run on user-facing pages.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|robots.txt|sitemap.xml|assets/|uploads/|api/).*)',
  ],
};
