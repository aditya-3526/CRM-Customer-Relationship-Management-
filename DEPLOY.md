# Deploying CRM Lite to AWS

Target architecture — one EC2 instance running nginx (serving the React build and
proxying `/api` to Node), with MongoDB hosted on Atlas rather than on the box.

```
Browser ──HTTP──> EC2 t3.micro
                    ├── nginx :80 ── static React build  (/var/www/crm)
                    └── nginx /api/ ──proxy──> Node :5000 (/var/www/crm-api)
                                                  │
                                                  └──TLS──> MongoDB Atlas M0
```

The database lives off-instance deliberately. A `t3.micro` has 1 GB of RAM, and
running `mongod` alongside Node on that leaves neither with enough headroom.
Atlas M0 is free indefinitely and removes the problem.

---

## Before you start

You'll need, in this order:

1. An AWS account
2. A MongoDB Atlas account
3. A Google AI Studio API key — optional; only the AI insights and
   natural-search routes need it, and the rest of the app works without it

### A note on free tier

Which free tier you get depends on when the AWS account was created:

| Account created | What you get |
|---|---|
| Before 15 Jul 2025 | Legacy tier: 750 hrs/month of `t3.micro` for 12 months. This runs genuinely free. |
| On or after 15 Jul 2025 | New model: $100 credit (up to $200 via onboarding tasks), 6 months. EC2 draws down against that balance rather than having a separate allowance. |

Either way, **set a billing alarm before you launch anything.** Billing → Budgets
→ Create budget → Zero spend budget. On the new-model account this is also one of
the five tasks that earns you an extra $20.

Costs that surprise people:

- **Public IPv4 is billed at ~$3.60/month** outside the legacy 12-month allowance.
  It applies to every instance with a public IP, running or stopped.
- **Gemini API usage is billed by Google**, entirely separate from AWS.
- An Elastic IP that isn't attached to a running instance is charged hourly.

---

## Step 1 — MongoDB Atlas

1. Sign up at <https://www.mongodb.com/cloud/atlas/register>
2. Create a cluster → **M0 Free** tier. Pick the AWS region you'll use for EC2 —
   same region means lower latency.
3. **Database Access** → Add New Database User. Choose password auth, and use the
   Autogenerate button. Save the password now; you can't view it later.
4. **Network Access** → Add IP Address.
   - For initial setup, `0.0.0.0/0` gets you moving.
   - Once EC2 is running, **replace it with the instance's public IP as a /32**.
     An M0 cluster open to the whole internet is protected by nothing but that
     password.
5. **Database → Connect → Drivers** → copy the connection string. It looks like:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Two edits before you use it:
   - Replace `<password>` with the real password. **URL-encode special
     characters** — `@` → `%40`, `#` → `%23`, `/` → `%2F`. A raw `@` silently
     breaks the connection string parser.
   - Insert the database name before the `?`: `.../crm?retryWrites=true...`

---

## Step 2 — Launch the EC2 instance

EC2 → Launch instance.

| Setting | Value |
|---|---|
| Name | `crm-server` |
| AMI | Ubuntu Server 24.04 LTS |
| Instance type | `t3.micro` |
| Key pair | Create new → RSA → `.pem` → **download it** |
| Storage | 20 GiB gp3 (30 GiB is the free-tier ceiling) |

**Security group** — create new, with exactly these inbound rules:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | Not `0.0.0.0/0`. Open SSH gets brute-forced within hours. |
| HTTP | 80 | `0.0.0.0/0` | Public site traffic |
| HTTPS | 443 | `0.0.0.0/0` | For later, once you add a domain |

Do **not** open port 5000. Node binds to `127.0.0.1` in production, so it's only
reachable through nginx.

Launch, then note the **Public IPv4 address**.

> The public IP changes on every stop/start. If that matters, allocate an Elastic
> IP and associate it — but keep it associated with a running instance, or it's
> billed hourly.

---

## Step 3 — Provision the server

Lock down the key file first, or SSH will refuse to use it:

```bash
chmod 400 ~/Downloads/crm-server.pem
ssh -i ~/Downloads/crm-server.pem ubuntu@YOUR_EC2_IP
```

Copy the setup script up and run it:

```bash
# from your Mac, in the repo root
scp -i ~/Downloads/crm-server.pem deploy/setup-server.sh deploy/nginx.conf ubuntu@YOUR_EC2_IP:~/

# then on the server
bash setup-server.sh
```

This installs Node 20, nginx, pm2 and ufw, creates a 2 GB swap file, and installs
the nginx site config. It's idempotent — re-run it safely.

The swap matters: `npm install` alone can exceed 1 GB and get OOM-killed
partway, leaving a corrupt `node_modules` that fails in confusing ways.

---

## Step 4 — Server environment file

On the server:

```bash
nano /var/www/crm-api/.env
```

Using `server/.env.example` as the template:

```env
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/crm?retryWrites=true&w=majority
JWT_SECRET=<paste output of: openssl rand -base64 48>
PORT=5000
NODE_ENV=production
GEMINI_API_KEY=<optional>
```

Generate the secret with `openssl rand -base64 48`. Do not invent one by hand —
the server rejects anything under 32 characters at boot, because this key is the
only thing standing between a forged token and full account access.

Leave `CORS_ORIGINS` empty. nginx serves both the frontend and API from one
origin, so no cross-origin requests occur.

---

## Step 5 — Build and deploy

From your Mac, in the repo root:

```bash
./deploy/push.sh ubuntu@YOUR_EC2_IP ~/Downloads/crm-server.pem
```

This builds the frontend **locally**, rsyncs the build and the API to the server,
installs production dependencies, and starts or restarts pm2.

The local build is deliberate: `react-scripts build` needs roughly 1.5 GB and
will OOM-kill on a `t3.micro` even with swap. Building on your machine avoids
the problem entirely and makes deploys faster.

Make pm2 survive reboots — on the server, once:

```bash
pm2 startup     # prints a sudo command
# run the command it prints, then:
pm2 save
```

---

## Step 6 — Verify

```bash
# on the server
curl http://localhost:5000/api/health     # Node directly
curl http://localhost/api/health          # through nginx

# from your Mac
curl http://YOUR_EC2_IP/api/health
```

All three should return `{"status":"ok","uptime":...}`. Then open
`http://YOUR_EC2_IP/` and register an account.

To load sample data:

```bash
cd /var/www/crm-api && node seedData.js
```

---

## Step 7 — Tighten up

Once it works:

1. **Restrict Atlas network access** to the EC2 public IP as a `/32`, replacing
   `0.0.0.0/0`.
2. **Add HTTPS.** Point a domain at the instance, then:

   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

   Certbot edits the nginx config and sets up auto-renewal. Free, and it takes
   about a minute. Until then all traffic — including login passwords — crosses
   the network in plaintext.
3. **Confirm the billing alarm** is actually active.

---

## Troubleshooting

Everything below was hit for real during the first deployment. Ordered roughly
by how much time each one costs before you work out what's happening.

### The app loads but login fails, while `curl` to the same endpoint succeeds

The single most misleading failure available. Browsers send an `Origin` header on
**every non-GET request, including same-origin ones**. `curl` doesn't, unless you
add it. So a CORS allowlist that rejects unlisted origins will break every POST
from a browser while `curl` and all GETs keep working — including any health
check built on `curl`.

Reproduce the browser's actual request:

```bash
curl -s -X POST http://YOUR_IP/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://YOUR_IP' \
  -d '{"email":"admin@crm.com","password":"password123"}'
```

If that fails where the header-less version succeeded, it's CORS. `server.js`
now treats same-origin as always allowed by comparing the `Origin` host against
the request's `Host` header.

**General lesson: a health check that doesn't exercise the same method and
headers as real traffic will report success over a broken app.**

### `MongoDB connection error: bad auth : authentication failed`

The credential is wrong — but note this message means the connection *reached*
Atlas, so networking and the IP allowlist are fine. Distinguishing these two is
the useful part:

| Symptom | Meaning |
|---|---|
| `bad auth : authentication failed` | Network is fine, password/user is wrong |
| `MongooseServerSelectionError` / timeout | Never reached Atlas — IP not on the access list |

Common causes of the first: password not URL-encoded, `<db_password>` left
literal, or a password reset that wasn't saved. Rewrite `.env` with the block in
Step 4, which encodes automatically.

### `connect ECONNREFUSED 127.0.0.1:27017`

Something is falling back to a local MongoDB. It means that file never loaded
`.env`. `seedData.js` had exactly this bug — it hardcoded
`mongodb://localhost:27017/crm-lite`, which also pointed at a *different
database name* than the app reads. Check for `require('dotenv').config()` at the
top and that the connection uses `process.env.MONGO_URI`.

### SSH hangs and times out (not "connection refused")

A timeout means packets are being dropped, which is what a security group does
to an unlisted source IP. A refusal would mean you reached the host. Your home
IP rotates:

```bash
curl -s https://checkip.amazonaws.com
```

If it differs from the SSH rule's source, fix it in EC2 → Security Groups →
`launch-wizard-1` → Edit inbound rules → Source → **My IP**. The same rotation
breaks the Atlas access-list entry.

When adding a new IP, **add it alongside the old one** rather than replacing it.
If your assumption about the current IP is wrong, you lock yourself out of the
box you're trying to fix. Delete the stale entry once the new one is confirmed.

Escape hatch when locked out: EC2 → select instance → **Connect** → **EC2
Instance Connect** gives a browser terminal that ignores the SSH rule entirely.

### Frontend build fails: `Environment key "jest/globals" is unknown`

CRA 5 dependency drift — `eslint-config-react-app/jest` declares an env that
newer `eslint-plugin-jest` releases no longer register. It's a lint *config*
error, not a code error. `push.sh` sets `DISABLE_ESLINT_PLUGIN=true` so it can't
block a deploy. Run `npx eslint src` separately if you want linting.

### `ENOSPC: no space left on device`, or `node_modules` is absurdly large

Don't run `npm install` on an ExFAT or FAT volume. Large allocation units mean
every one of `node_modules`' ~100,000 tiny files consumes a full cluster —
observed at **15 GB for a 1 GB install**. ExFAT also lacks symlink support and
POSIX permissions, both of which npm depends on for `.bin` shims.

Check what you're on:

```bash
diskutil info /Volumes/YOUR_DRIVE | grep -i "file system"
```

A scattering of `._` files is a giveaway: macOS only writes those AppleDouble
sidecars on filesystems lacking native metadata support. Build on your internal
APFS disk.

### 502 Bad Gateway

nginx is up, Node isn't.

```bash
pm2 status
pm2 logs crm-api --lines 50
```

A restart count climbing steadily means a crash loop — the app is exiting at
boot, almost always on the database connection. `server.js` validates required
env vars at startup and names the missing one.

Note `max_restarts: 10` in the pm2 config: after ten failures it gives up and
sits in `stopped`. `pm2 restart` won't revive it; use
`pm2 start deploy/ecosystem.config.js`.

### Frontend loads but every API call 404s

The bundle was built with a stale `REACT_APP_API_BASE_URL`. CRA inlines env vars
at **build** time, so this cannot be fixed on the server — unset it and rebuild.
Confirm what actually shipped:

```bash
curl -s http://YOUR_IP/static/js/main.*.js | grep -o "localhost:[0-9]*" | sort -u
```

Empty output is correct.

### Stale UI after a deploy

Hard-reload (Cmd+Shift+R) before debugging anything else. If it persists, the
`index.html` cache headers aren't applying. Note that nginx's `add_header` does
**not** inherit into a block that defines its own — the config repeats the
security headers in each such block for exactly this reason.

### Deep links 404 on refresh

The `try_files` SPA fallback isn't active. Check `sudo nginx -t`, confirm
`/etc/nginx/sites-enabled/crm` exists and the default site was removed.

### Instance unreachable after stop/start

The public IP changed. Check the EC2 console — and remember the new IP needs
adding to the Atlas access list too.

### Out of memory during `npm ci`

Confirm swap: `swapon --show`. `setup-server.sh` creates 2 GB. The React build
is never run on the server for this reason — it needs ~1.5 GB and will
OOM-kill a `t3.micro` even with swap.

---

## Routine operations

```bash
pm2 logs crm-api              # tail application logs
pm2 restart crm-api           # after config changes
sudo systemctl reload nginx   # after nginx config changes
sudo nginx -t                 # validate before reloading — always
df -h                         # disk usage
free -h                       # memory and swap
```

Redeploy after code changes: re-run `./deploy/push.sh` with the same arguments.
