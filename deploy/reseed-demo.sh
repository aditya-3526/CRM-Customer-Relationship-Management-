#!/usr/bin/env bash
#
# Restore the public demo to its seeded state.
#
# The live demo publishes its login credentials, so any visitor can delete
# customers. That's fine — it's fake data — but a recruiter arriving at an empty
# dashboard would conclude the app is broken. This runs nightly so the demo is
# always populated.
#
# Install on the server:
#   chmod +x /var/www/crm-api/deploy/reseed-demo.sh
#   crontab -e
#   # then add (03:00 IST = 21:30 UTC):
#   30 21 * * * /var/www/crm-api/deploy/reseed-demo.sh >> /var/log/crm/reseed.log 2>&1
#
# Verify it's scheduled with:  crontab -l

set -euo pipefail

APP_DIR="/var/www/crm-api"
cd "$APP_DIR"

echo "=== reseed $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="

if [[ ! -f .env ]]; then
  echo "ERROR: $APP_DIR/.env not found — cannot connect to the database." >&2
  exit 1
fi

# seedData.js clears Users, Customers and Communications before inserting, so
# this is a full reset rather than an append. Node is invoked by absolute path
# because cron runs with a minimal PATH that usually excludes /usr/bin/node.
NODE_BIN="$(command -v node || echo /usr/bin/node)"

if "$NODE_BIN" seedData.js; then
  echo "reseed OK"
else
  echo "reseed FAILED (exit $?)" >&2
  exit 1
fi
