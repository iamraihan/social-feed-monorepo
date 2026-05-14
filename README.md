# Social Feed — Monorepo

Fullstack social feed (sign up, post text + image, like, comment with one level of reply, public/private visibility) built for the **Appifylab Full Stack Engineer selection task**.

This repo bundles both apps as a pnpm workspace so the whole stack runs from a single command.

```
social-feed/
├── apps/
│   ├── api/   ← NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis
│   └── web/   ← Next.js 16 (App Router) + React 19
└── scripts/dev.sh   ← orchestrator: prep + boot both apps in parallel
```

> The two apps are also published as standalone repos
> ([api](https://github.com/iamraihan/social-feed-api) ·
> [web](https://github.com/iamraihan/social-feed-web)) for inspecting each
> side in isolation. This monorepo is the recommended path for evaluation.

---

## Quick start

Prerequisites: **Docker Desktop running**, **Node.js 20+**, **pnpm 9+** (`npm install -g pnpm`).

```bash
git clone https://github.com/iamraihan/social-feed.git
cd social-feed
pnpm dev
```

`pnpm dev` does **everything** in one shot:

1. Installs dependencies for both apps (pnpm workspace install)
2. Creates `apps/api/.env` and `apps/web/.env.local` from their templates (only if missing)
3. Generates a real `JWT_ACCESS_SECRET` (only if still the placeholder)
4. Brings up Postgres, Redis, and pgAdmin via Docker
5. Waits for Postgres to be ready
6. Runs Prisma migrations and generates the client
7. Boots **NestJS** on `:8000` and **Next.js** on `:3000` side by side, with prefixed log streams (`[api]` / `[web]`)

When you see `Nest application successfully started` and Next.js's `Local: http://localhost:3000`, open **<http://localhost:3000>** and sign up.

`Ctrl+C` stops both servers cleanly. Re-running `pnpm dev` is idempotent — it skips prep steps that are already done.

To stop the Docker containers (Postgres / Redis / pgAdmin):

```bash
pnpm stop
```

---

## What's in the apps

Each subfolder has its own README with full module-by-module detail:

- **[apps/api/README.md](apps/api/README.md)** — endpoints, auth model, image pipeline, indexing strategy, pagination, env validation
- **[apps/web/README.md](apps/web/README.md)** — routing, server actions, TanStack Query usage, proxy / auth flow

---

## Ports

| Port | Service |
| --- | --- |
| `3000` | Next.js web app |
| `8000` | NestJS API |
| `5050` | pgAdmin (web UI; login from `apps/api/.env`) |
| `5434` | Postgres (host-side; non-standard to avoid clashing with a local install) |
| `6379` | Redis |

---

## Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | One-command bootstrap + run (see above) |
| `pnpm stop` | Stop Docker containers (Postgres, Redis, pgAdmin) |
| `pnpm --filter ./apps/api db:migrate` | Run a new Prisma migration |
| `pnpm --filter ./apps/api db:reset` | Wipe DB and re-migrate |
| `pnpm --filter ./apps/api db:studio` | Open Prisma Studio |
| `pnpm --filter ./apps/api lint` | Lint the API |
| `pnpm --filter ./apps/web lint` | Lint the web |

---

## Why no live deployment?

The backend depends on Postgres, Redis, and image storage. A faithful hosted version needs managed Postgres + managed Redis + S3/GCS, which means a paid AWS/GCP/Render setup. For a single hiring task I didn't feel that recurring cost was justified — but the code is written to deploy cleanly:

- `StorageService` is an abstract class; swapping local disk for S3 is a one-file change with no consumer-side modifications.
- The config validator at boot (`apps/api/src/config/environment.validation.ts`) refuses to start the app on misconfig, so a misconfigured prod deploy dies at boot rather than first request.
- `docker-compose.yml` defines every service and they all use healthchecks, so the same compose file is ready for a single-host VPS deploy.

If a live deployment is required, I'm happy to provision one for the duration of the evaluation — please let me know.
