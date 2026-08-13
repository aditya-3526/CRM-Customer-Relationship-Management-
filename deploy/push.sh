#!/usr/bin/env bash
#
# Build locally and push to the EC2 instance. Run from your Mac, in the repo root.
#
#   ./deploy/push.sh ubuntu@1.2.3.4 ~/keys/crm.pem
#
# The frontend is built HERE, not on the server: `react-scripts build` needs
# ~1.5 GB and reliably OOM-kills a 1 GB t3.micro even with swap.

set -euo pipefail

HOST="${1:-}"
KEY="${2:-}"

if [[ -z "$HOST" || -z "$KEY" ]]; then
  echo "Usage: $0 <user@host> <path-to-key.pem>" >&2
  echo "Example: $0 ubuntu@1.2.3.4 ~/keys/crm.pem" >&2
  exit 1
fi

if [[ ! -f "$KEY" ]]; then
  echo "Key file not found: $KEY" >&2
  exit 1
fi
chmod 400 "$KEY" 2>/dev/null || true

SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST")
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

# --- Build frontend ---------------------------------------------------------
log "Building frontend locally"
cd crm-lite-frontend
npm ci

# No REACT_APP_API_BASE_URL: the bundle falls back to the relative '/api' path,
# which nginx proxies. Keeps the build portable across hostnames.
#
# DISABLE_ESLINT_PLUGIN: eslint-config-react-app/jest declares a `jest/globals`
# env that newer eslint-plugin-jest releases no longer register. That's CRA 5
# dependency drift failing the build on a lint-config error, not a code error —
# it has no business blocking a deploy. Run `npx eslint src` separately if you
# want linting.
#
# CI=false: CRA promotes warnings to errors whenever CI is set, which most build
# agents do by default. No effect locally; prevents a surprise elsewhere.
DISABLE_ESLINT_PLUGIN=true CI=false npm run build
cd "$REPO_ROOT"

if [[ ! -d crm-lite-frontend/build ]]; then
  echo "Build directory missing — build failed." >&2
  exit 1
fi

# --- Ship frontend ----------------------------------------------------------
log "Uploading frontend to /var/www/crm"
rsync -avz --delete -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  crm-lite-frontend/build/ "$HOST:/var/www/crm/"

# --- Ship API ---------------------------------------------------------------
# Excludes .env so a local dev config never clobbers the server's production one.
log "Uploading API to /var/www/crm-api"
rsync -avz --delete -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  --exclude node_modules \
  --exclude .env \
  --exclude '._*' \
  server/ "$HOST:/var/www/crm-api/"

log "Uploading deploy configs"
rsync -avz -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  --exclude '._*' \
  deploy/ "$HOST:/var/www/crm-api/deploy/"

# --- Install and restart ----------------------------------------------------
log "Installing production dependencies and restarting"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/crm-api

if [[ ! -f .env ]]; then
  echo "ERROR: /var/www/crm-api/.env is missing." >&2
  echo "Create it from server/.env.example before deploying." >&2
  exit 1
fi

npm ci --omit=dev

if pm2 describe crm-api >/dev/null 2>&1; then
  pm2 restart crm-api --update-env
else
  pm2 start deploy/ecosystem.config.js
  pm2 save
fi

sleep 3
echo "--- health check ---"
curl -fsS http://localhost:5000/api/health && echo
REMOTE

log "Deploy complete"
echo "Visit: http://${HOST#*@}/"
