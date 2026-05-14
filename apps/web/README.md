# Buddy Script — Social Feed Web

A social feed web app built on **Next.js 16** (App Router) with React 19,
Server Components, Server Actions, and TanStack Query for client-side
mutations. Talks to a separate backend API over HTTP with httpOnly
session cookies.

> **Heads up:** this is **Next.js 16** — APIs and conventions differ from
> earlier versions. Notably, the old `middleware.ts` is renamed to
> `proxy.ts` and runs on the Edge runtime. See `AGENTS.md`.

---

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| UI | React 19 |
| Data fetching | Server Components + Server Actions (server) · TanStack Query (client) |
| Forms | react-hook-form + Zod (`@hookform/resolvers`) |
| Validation | Zod 4 |
| Styling | Bootstrap 5 + custom CSS (in `public/assets/css`) |
| Package manager | pnpm |
| Language | TypeScript 5 |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- The **backend API** running locally on `http://localhost:8000` (separate repo)

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Create your local env file
cp .env.example .env.local
# Edit .env.local if your backend runs elsewhere.

# 3. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The first hit redirects to `/login` because the proxy gates every page on
the `refresh_token` httpOnly cookie.

---

## Environment Variables

Defined in `.env.local` (validated by Zod at boot in `config/env.ts`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `API_URL` | yes | Backend base URL. Server-only; never exposed to the browser. |
| `COOKIE_SECURE` | no | `true` in production so session cookies require HTTPS. Defaults to `true` when `NODE_ENV=production`, otherwise `false`. |

If `API_URL` is missing or invalid, the app crashes at boot with a clear
message — by design.

---

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start Next.js in dev mode on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint (Next.js + TypeScript rules) |

---

## Project Structure

```
.
├── app/                       # App Router routes
│   ├── (auth)/                # Login & register (no chrome)
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                # Authenticated app shell (header + sidebars)
│   │   └── page.tsx           # Home feed
│   ├── layout.tsx             # Root layout (metadata, providers, global CSS)
│   ├── global-error.tsx       # Top-level error boundary
│   └── not-found.tsx
│
├── features/                  # Feature-sliced modules
│   ├── auth/                  # Login/register/logout, session helpers
│   ├── feed/                  # Posts, comments, replies, likes
│   ├── users/                 # User profile data + components
│   ├── events/                # Events sidebar widget
│   └── explore/               # Explore widget
│
├── components/
│   ├── layout/                # Header, sidebars
│   ├── providers/             # QueryProvider (TanStack Query)
│   └── ui/                    # Reusable primitives (Modal, Avatar, etc.)
│
├── lib/
│   ├── api-client.ts          # Typed fetch wrapper, ApiClientError
│   ├── auth-fetch.ts          # Authenticated server-side fetch
│   ├── api-types.ts           # ApiSuccess / ApiError envelope types
│   └── safe-log.ts            # PII-safe logger
│
├── config/
│   └── env.ts                 # Zod-validated server env (server-only)
│
├── public/
│   └── assets/                # Bootstrap + theme CSS, images
│
├── proxy.ts                   # Edge-runtime auth gate + token refresh
├── instrumentation.ts         # Process-boot hook (logger / tracing init)
├── next.config.ts             # CSP, image hosts, server-action limits
└── AGENTS.md                  # House rules for AI / contributors
```

Each `features/<name>/` slice typically contains:

- `actions/` — Server Actions (mutations, paginated fetches)
- `api/` — Server-side API client functions
- `components/` — Server + Client components
- `data/` — Server Components that fetch + render
- `hooks/` — Client hooks (TanStack Query)
- `schemas/` — Zod schemas + inferred types
- `types.ts`, `index.ts` — Public surface of the slice

---

## Architecture Notes

### Auth & token refresh (`proxy.ts`)

- Every page request hits the **proxy** (Next.js 16's renamed
  `middleware`) on the Edge.
- The proxy gates on the **`refresh_token`** httpOnly cookie — never on
  the non-httpOnly `session_user` cookie (XSS-forgeable).
- If `access_token` is missing but `refresh_token` is alive, the proxy
  pre-emptively calls `POST /auth/refresh`, sets fresh cookies, and
  redirects to the same URL. Server Components then see fresh tokens.
- Refresh **must** happen at the proxy because Server Components cannot
  write cookies; doing it elsewhere risks losing the rotated
  `refresh_token` and locking the user out.
- Static asset requests (`_next/*`, `favicon.ico`, `sw.js`,
  `robots.txt`, `sitemap.xml`, `assets/`, `uploads/`, `api/`) bypass the
  proxy so they don't burn refresh-token rotations.

### Server vs client data flow

- **Initial render:** Server Components call `authenticatedFetch` (in
  `lib/auth-fetch.ts`) which attaches the access-token Bearer to the
  backend request.
- **Mutations & paginated fetches:** Server Actions in
  `features/<x>/actions/` — invoked from Client Components via
  TanStack Query for optimistic updates and cache reconciliation.
- The API envelope is normalized to `{success, data}` / `{success: false,
  error}` and unwrapped by `apiRequest` — callers receive plain payloads
  or throw a typed `ApiClientError`.

### Security posture (`next.config.ts`)

- Strict baseline CSP, `X-Frame-Options: DENY`, `nosniff`, restrictive
  `Permissions-Policy`.
- Server Actions: `bodySizeLimit: 6mb` (sized for the 5 MB image cap).
- `images.dangerouslyAllowLocalIP` is **dev-only** — production keeps
  Next.js's SSRF guard against private-IP image hosts.
- Add your production backend host to `images.remotePatterns` before
  deploying.

---

## Features

- **Auth** — Email/password login & register with httpOnly cookie
  session and edge-side token refresh.
- **Feed** — Paginated post list with infinite scroll.
- **Posts** — Create with optional image (5 MB max), like, delete.
- **Comments & replies** — Nested, paginated, with optimistic create &
  like via TanStack Query cache reconciliation.
- **Likers modal** — Paginated list of users who liked a post.
- **Profile popover** — Header avatar opens a profile menu.
- **Sidebars** — Events and Explore widgets.

---

## Deployment

Production checklist:

1. Set `API_URL` to your production backend.
2. Set `COOKIE_SECURE=true` (or rely on `NODE_ENV=production`).
3. Add your production backend host to `images.remotePatterns` in
   `next.config.ts`.
4. Confirm `images.dangerouslyAllowLocalIP` stays disabled in prod
   (already gated on `NODE_ENV`).
5. Tighten the CSP in `next.config.ts` once the inline-style/script
   surface is migrated to nonces.

```bash
pnpm build
pnpm start
```
