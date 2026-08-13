#!/usr/bin/env bash
#
# One-time provisioning for a fresh Ubuntu 22.04/24.04 EC2 instance.
#
# Run ON THE SERVER, as the default 'ubuntu' user:
#   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
#   bash setup-server.sh
#
# Idempotent — safe to re-run.

set -euo pipefail

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m[warn] %s\033[0m\n' "$1"; }

if [[ $EUID -eq 0 ]]; then
  echo "Run this as the 'ubuntu' user, not root. It will sudo where needed." >&2
  exit 1
fi

# --- Swap -------------------------------------------------------------------
# A t3.micro has 1 GB RAM. npm install alone can exceed that and get OOM-killed
# mid-install, leaving a corrupt node_modules. 2 GB of swap makes it survivable.
if ! sudo swapon --show | grep -q '/swapfile'; then
  log "Creating 2 GB swap file"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  # Prefer RAM; only reach for swap under real pressure.
  sudo sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
else
  log "Swap already present, skipping"
fi

# --- Packages ---------------------------------------------------------------
log "Updating apt and installing base packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo apt-get install -y curl git nginx ufw

# --- Node 20 LTS ------------------------------------------------------------
# Ubuntu's packaged Node is too old for Express 5 / Mongoose 8.
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  log "Installing Node.js 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node $(node -v) already installed, skipping"
fi

log "Node $(node -v), npm $(npm -v)"

# --- pm2 --------------------------------------------------------------------
if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing pm2"
  sudo npm install -g pm2
else
  log "pm2 already installed, skipping"
fi

# --- Directories ------------------------------------------------------------
log "Creating application directories"
sudo mkdir -p /var/www/crm /var/www/crm-api /var/log/crm
sudo chown -R "$USER":"$USER" /var/www/crm /var/www/crm-api /var/log/crm

# --- Firewall ---------------------------------------------------------------
# Defence in depth behind the EC2 security group. Note port 5000 is deliberately
# NOT opened — Node binds to loopback and is only reachable via nginx.
log "Configuring ufw"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# --- nginx ------------------------------------------------------------------
if [[ -f "$(dirname "$0")/nginx.conf" ]]; then
  log "Installing nginx site config"
  sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/crm
  sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/crm
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
  sudo systemctl enable nginx
else
  warn "nginx.conf not found next to this script — install it manually."
fi

cat <<'EOF'

============================================================
  Base server setup complete.
============================================================

Still to do — see DEPLOY.md for detail:

  1. Upload the API code to  /var/www/crm-api
  2. Create /var/www/crm-api/.env   (copy from server/.env.example)
  3. cd /var/www/crm-api && npm ci --omit=dev
  4. pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
  5. Upload the built frontend to  /var/www/crm

Verify with:
  curl http://localhost/api/health

EOF
