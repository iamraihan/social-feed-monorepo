#!/usr/bin/env bash
# One-command dev: prepare the API (env, Docker, migrations) then run
# NestJS + Next.js side-by-side with prefixed logs. Ctrl+C stops both.
#
# Safe to re-run — the API prep step is idempotent.

set -euo pipefail

BOLD=$'\033[1m'; BLUE=$'\033[34m'; GREEN=$'\033[32m'; RED=$'\033[31m'; RESET=$'\033[0m'
step() { printf "\n${BOLD}${BLUE}==>${RESET} ${BOLD}%s${RESET}\n" "$1"; }
ok()   { printf "    ${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "\n${RED}✗ %s${RESET}\n" "$1" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---- 1. install workspace deps ---------------------------------------------
step "Installing workspace dependencies"
command -v pnpm >/dev/null 2>&1 || fail "pnpm not found. Install with: npm install -g pnpm"
pnpm install --silent
ok "Dependencies installed (both apps)"

# ---- 2. prepare the web app's env file -------------------------------------
step "Configuring web env"
if [ -f apps/web/.env.local ]; then
  ok "apps/web/.env.local already exists — leaving untouched"
else
  cp apps/web/.env.example apps/web/.env.local
  ok "apps/web/.env.local created from .env.example"
fi

# ---- 3. prepare the API (env, JWT, Docker, migrations) ---------------------
# Delegate to the API's own setup script with --no-server so it stops
# short of booting Nest. We boot it ourselves below alongside the web app.
bash apps/api/scripts/setup.sh --no-server

# ---- 4. boot both apps in parallel -----------------------------------------
step "Starting API and Web (press Ctrl+C to stop both)"
cat <<EOF

  • API:   http://localhost:8000
  • Web:   http://localhost:3000
  • pgAdmin (optional): http://localhost:5050

EOF

# concurrently colors each app's log stream and forwards SIGINT to both,
# so one Ctrl+C cleanly tears down NestJS and Next.js together.
exec pnpm exec concurrently \
  --names "api,web" \
  --prefix-colors "blue,magenta" \
  --kill-others-on-fail \
  "pnpm --filter ./apps/api start:dev" \
  "pnpm --filter ./apps/web dev"
