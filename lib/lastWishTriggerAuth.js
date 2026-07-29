import { isCronAuthorized } from './cronAuth.js';

/** Auth for Last Wish cron / manual trigger endpoints. Requires CRON_SECRET bearer token. */
export function isLastWishTriggerAuthorized(req) {
  return isCronAuthorized(req);
}
