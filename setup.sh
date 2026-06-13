#!/usr/bin/env bash
#
# setup.sh — ARTH.OS first-time development environment bootstrap
#
# Usage:
#   chmod +x setup.sh && ./setup.sh
#
# What it does:
#   1. Checks prerequisites (Node 18+, npm 9+)
#   2. Copies .env.example → .env.local if not present
#   3. Installs npm dependencies
#   4. Runs database migrations (if DATABASE_URL is configured)
#   5. Runs type checking
#   6. Runs tests to verify everything works
#
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }

# ---------------------------------------------------------------------------
# Phase 1: Pre-requisite checks
# ---------------------------------------------------------------------------
info "Checking prerequisites..."

NODE_VERSION="$(node --version 2>/dev/null || true)"
NPM_VERSION="$(npm --version 2>/dev/null || true)"

if [ -z "$NODE_VERSION" ]; then
  err "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"
  exit 1
fi

# Strip 'v' prefix, compare major version
NODE_MAJOR="$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node.js 18+ is required (found $NODE_VERSION). Upgrade at https://nodejs.org"
  exit 1
fi
ok "Node.js $NODE_VERSION"

if [ -z "$NPM_VERSION" ]; then
  err "npm is not installed. Install npm 9+"
  exit 1
fi
NPM_MAJOR="$(echo "$NPM_VERSION" | cut -d. -f1)"
if [ "$NPM_MAJOR" -lt 9 ]; then
  warn "npm 9+ recommended (found $NPM_VERSION). Run: npm install -g npm@latest"
fi
ok "npm $NPM_VERSION"

# ---------------------------------------------------------------------------
# Phase 2: Environment file
# ---------------------------------------------------------------------------
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    info "Creating .env.local from .env.example..."
    cp .env.example .env.local
    ok ".env.local created — edit it with your credentials"
  else
    warn "No .env.example found; skipping environment file setup"
  fi
else
  ok ".env.local already exists"
fi

# ---------------------------------------------------------------------------
# Phase 3: Install dependencies
# ---------------------------------------------------------------------------
info "Installing npm dependencies..."
npm install
ok "Dependencies installed"

# ---------------------------------------------------------------------------
# Phase 4: Database migration (optional)
# ---------------------------------------------------------------------------
if [ -n "${DATABASE_URL:-}" ]; then
  info "DATABASE_URL is set — running migrations..."
  npm run migrate 2>/dev/null && ok "Migrations complete" || warn "Migration script exited with non-zero (may be OK)"
else
  info "DATABASE_URL not set — skipping database migration"
  info "  To enable, set DATABASE_URL in .env.local or export it"
fi

# ---------------------------------------------------------------------------
# Phase 5: Type checking
# ---------------------------------------------------------------------------
info "Running TypeScript type check..."
if npm run type-check 2>/dev/null; then
  ok "Type checking passed"
else
  warn "Type checking reported errors (may be pre-existing)"
fi

# ---------------------------------------------------------------------------
# Phase 6: Run tests
# ---------------------------------------------------------------------------
info "Running unit tests..."
if npm test -- --run 2>/dev/null; then
  ok "All tests passed"
else
  warn "Some tests failed — inspect the output above"
fi

# ---------------------------------------------------------------------------
# Phase 7: Git hooks (Husky)
# ---------------------------------------------------------------------------
if [ -d .husky ]; then
  info "Setting up Git hooks (Husky)..."
  npx husky install 2>/dev/null && ok "Git hooks installed" || warn "Husky setup failed"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ARTH.OS development environment is ready!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "    • npm run dev         Start development server"
echo "    • npm test            Run tests"
echo "    • npm run build       Create production build"
echo "    • npm run type-check  TypeScript verification"
echo ""
echo "  Edit .env.local to configure:"
echo "    - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
echo "    - STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET"
echo "    - VITE_SENTRY_DSN (optional)"
echo ""
