
#!/usr/bin/env bash
# One-shot local setup: env file, JWT secret, docker services, db migrations.
# Idempotent — safe to re-run. Never overwrites an existing .env.

set -euo pipefail

# When run by the monorepo orchestrator, we only want the prep steps —
# the orchestrator boots the dev server itself so it can run web alongside.
NO_SERVER=0
for arg in "$@"; do
  case "$arg" in
    --no-server) NO_SERVER=1 ;;
  esac
done

# ---- helpers ----------------------------------------------------------------
BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
RED=$'\033[31m'; BLUE=$'\033[34m'; RESET=$'\033[0m'

step()  { printf "\n${BOLD}${BLUE}==>${RESET} ${BOLD}%s${RESET}\n" "$1"; }
ok()    { printf "    ${GREEN}✓${RESET} %s\n" "$1"; }
warn()  { printf "    ${YELLOW}!${RESET} %s\n" "$1"; }
fail()  { printf "\n${RED}✗ %s${RESET}\n" "$1" >&2; exit 1; }

# Always run from the repo root, no matter where the script is called from.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ---- 1. prerequisite check --------------------------------------------------
step "Checking prerequisites"

command -v docker  >/dev/null 2>&1 || fail "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"
docker info        >/dev/null 2>&1 || fail "Docker is installed but not running. Start Docker Desktop and try again."
ok "Docker is running"

command -v pnpm    >/dev/null 2>&1 || fail "pnpm is not installed. Install with: npm install -g pnpm"
ok "pnpm $(pnpm --version) detected"

command -v node    >/dev/null 2>&1 || fail "Node.js is not installed. Install Node.js 20+: https://nodejs.org"
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 20 ] || fail "Node.js 20+ required (found $(node --version))."
ok "Node.js $(node --version) detected"

# ---- 2. install dependencies ------------------------------------------------
step "Installing dependencies"
if [ -d node_modules ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
  ok "node_modules already present — running pnpm install to sync"
else
  ok "Fresh install"
fi
pnpm install --silent
ok "Dependencies installed"

# ---- 3. .env file -----------------------------------------------------------
step "Configuring environment"
if [ -f .env ]; then
  ok ".env already exists — leaving it untouched"
else
  cp .env.example .env
  ok ".env created from .env.example"
fi

# ---- 4. JWT secret ----------------------------------------------------------
# Replace placeholder secret only if it's still the default. Never overwrite
# a real secret the reviewer may have already set.
if grep -q "^JWT_ACCESS_SECRET=change_me_to_a_64_char_random_string" .env; then
  if command -v openssl >/dev/null 2>&1; then
    SECRET=$(openssl rand -hex 64)
  else
    SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  fi
  # Portable in-place edit (works on BSD sed / macOS and GNU sed).
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${SECRET}|" .env
  else
    sed -i '' "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${SECRET}|" .env
  fi
  ok "JWT_ACCESS_SECRET generated"
else
  ok "JWT_ACCESS_SECRET already set — leaving it untouched"
fi

# ---- 5. start docker services -----------------------------------------------
step "Starting Postgres, Redis, pgAdmin (Docker)"
docker compose up -d
ok "Containers started"

# ---- 6. wait for postgres to be healthy -------------------------------------
step "Waiting for Postgres to be ready"
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose exec -T postgres pg_isready -U "$(grep ^POSTGRES_USER .env | cut -d= -f2)" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    fail "Postgres did not become ready within $((MAX_ATTEMPTS * 2))s. Check 'docker compose logs postgres'."
  fi
  printf "    ${DIM}…waiting (%d/%d)${RESET}\r" "$ATTEMPTS" "$MAX_ATTEMPTS"
  sleep 2
done
ok "Postgres is accepting connections"

# ---- 7. prisma migrate ------------------------------------------------------
step "Running database migrations"
pnpm exec prisma migrate deploy
ok "Schema is up to date"

step "Generating Prisma client"
pnpm exec prisma generate
ok "Prisma client generated"

# ---- 8. done ----------------------------------------------------------------
cat <<EOF

${GREEN}${BOLD}Setup complete.${RESET}

Useful URLs once the API is up:
  • API:        http://localhost:8000
  • pgAdmin:    http://localhost:5050   (login from .env — PGADMIN_DEFAULT_*)
  • Postgres:   localhost:5434          (user/pass from .env — POSTGRES_*)
  • Redis:      localhost:6379

Other scripts:
  • pnpm db:down     — stop containers
  • pnpm db:reset    — wipe database and re-migrate
  • pnpm db:studio   — open Prisma Studio

EOF

# ---- 9. boot the API in watch mode ------------------------------------------
if [ "$NO_SERVER" -eq 1 ]; then
  exit 0
fi

step "Starting NestJS (watch mode) — press Ctrl+C to stop"
# exec replaces this shell with NestJS so Ctrl+C goes straight to the dev server.
exec pnpm start:dev
