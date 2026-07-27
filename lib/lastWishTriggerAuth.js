/** Auth for Last Wish cron / manual trigger endpoints. */
export function isLastWishTriggerAuthorized(req) {
  const headers = req.headers || {};
  const secret = process.env.CRON_SECRET || process.env.LAST_WISH_TRIGGER_SECRET;
  const auth = headers.authorization || headers.Authorization || '';
  const ua = headers['user-agent'] || headers['User-Agent'] || '';

  // Vercel Cron: Authorization Bearer when CRON_SECRET is set, plus cron identity headers/UA
  if (secret && auth === `Bearer ${secret}`) return true;
  if (headers['x-vercel-cron'] || headers['x-vercel-cron-auth-token']) return true;
  if (typeof ua === 'string' && ua.includes('vercel-cron')) return true;

  return false;
}
