/**
 * Shared tag suggestion pool for client form and client list.
 * Single source of truth: common tags + all tags used across clients, filtered by search.
 */

/** Default tag suggestions (shown first in pool). */
export const COMMON_TAGS = [
  'Fiverr', 'Upwork', 'Freelancer', 'Premium', 'Long-term',
  'One-time', 'Referral', 'Website', 'Social Media', 'Repeat Client', 'VIP', 'Corporate'
];

/**
 * Returns a deduped, sorted pool of tags: COMMON_TAGS first, then any tag from any client.
 */
export function getTagSuggestionPool(clients: { tags?: string[] }[]): string[] {
  const fromClients = clients.flatMap(c => c.tags || []);
  const combined = [...new Set([...COMMON_TAGS, ...fromClients])];
  return combined.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
