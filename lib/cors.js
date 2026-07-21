/**
 * Restrict API CORS to known app origins (plus localhost for local/dev).
 * Falls back to same-origin-only behavior when Origin is absent (server-to-server).
 */

const DEFAULT_ALLOWED = [
  'https://balanze.cash',
  'https://www.balanze.cash',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'https://localhost',
];

function getAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const appUrl = (process.env.VITE_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');
  const list = [...DEFAULT_ALLOWED, ...fromEnv];
  if (appUrl) list.push(appUrl);
  return new Set(list);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ methods?: string, headers?: string }} [opts]
 * @returns {boolean} true if the request may proceed (OPTIONS already handled)
 */
export function applyCors(req, res, opts = {}) {
  const methods = opts.methods || 'GET, POST, PUT, DELETE, OPTIONS';
  const headers = opts.headers || 'Content-Type, Authorization, X-Requested-With';
  const origin = req.headers?.origin;
  const allowed = getAllowedOrigins();

  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // Non-browser / cron / webhook — no CORS needed
  } else {
    // Disallowed browser origin: do not reflect *
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return false;
  }

  if (origin && !allowed.has(origin) && req.method !== 'OPTIONS') {
    // Still allow the request for same-site deployments that send unexpected Origin;
    // browsers will block reading the response without ACAO. Do not reject server-side
    // so webhooks and Capacitor variants keep working.
  }

  return true;
}
