/**
 * Shared auth for Vercel Cron / privileged trigger endpoints.
 * Only Authorization: Bearer ${CRON_SECRET} is trusted.
 * Spoofable headers (x-vercel-cron, User-Agent) are never sufficient alone.
 */

export function isCronAuthorized(req) {
  const secret = process.env.CRON_SECRET || process.env.LAST_WISH_TRIGGER_SECRET;
  if (!secret) return false;

  const headers = req.headers || {};
  const rawAuth = headers.authorization || headers.Authorization || '';
  const auth = Array.isArray(rawAuth) ? rawAuth[0] || '' : rawAuth;

  return auth === `Bearer ${secret}`;
}
