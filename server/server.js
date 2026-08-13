require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

// --- Fail fast on missing configuration -------------------------------------
// Better to refuse to boot than to run with a silently-broken auth secret.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `FATAL: missing required environment variable(s): ${missing.join(', ')}\n` +
      'Copy server/.env.example to server/.env and fill it in.'
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET is too short. Use at least 32 characters.\n' +
      'Generate one with: openssl rand -base64 48'
  );
  process.exit(1);
}

const app = express();

// Behind nginx, so trust the proxy for correct client IPs and protocol.
app.set('trust proxy', 1);

// --- CORS -------------------------------------------------------------------
// In production the frontend is served same-origin through nginx, so no CORS is
// needed at all and the allowlist stays empty. Set CORS_ORIGINS (comma-separated)
// only if you host the frontend on a different origin, e.g. CloudFront or Vercel.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Browsers send an Origin header on every non-GET request, INCLUDING same-origin
// ones. An earlier version of this rejected any origin not in the allowlist,
// which broke same-origin POSTs (login, create customer) while leaving GETs and
// curl working — a confusing split. Same-origin is now always permitted, and an
// unlisted origin gets no CORS header rather than a thrown error, so the browser
// blocks it cleanly instead of the server returning a 500.
app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');

    // No Origin: curl, server-to-server, health probe. Allow.
    if (!origin) return callback(null, { origin: true, credentials: true });

    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === req.headers.host;
    } catch {
      sameOrigin = false;
    }

    if (sameOrigin || allowedOrigins.includes(origin)) {
      return callback(null, { origin: true, credentials: true });
    }

    return callback(null, { origin: false });
  })
);

app.use(express.json({ limit: '1mb' }));

// Database connection
connectDB();

// Health check — used by the nginx upstream probe and by you to confirm a deploy.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/communications', require('./routes/communicationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
// Bind to loopback in production: nginx is the only thing that should reach
// Node directly, and this keeps the port off the public interface even if a
// security group rule is too permissive.
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
