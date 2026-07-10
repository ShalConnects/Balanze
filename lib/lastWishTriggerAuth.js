/** Auth for Last Wish cron / manual trigger endpoints. */
export function isLastWishTriggerAuthorized(req) {
  const secret = process.env.CRON_SECRET || process.env.LAST_WISH_TRIGGER_SECRET;
  const auth = req.headers?.authorization || '';
  return !!(req.headers?.['x-vercel-cron'] || (secret && auth === `Bearer ${secret}`));
}
