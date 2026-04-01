/** Fuse key weights for investment entities in global header search. */
export const GLOBAL_SEARCH_INV_ASSET_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'name', weight: 0.35 },
  { name: 'symbol', weight: 0.35 },
  { name: 'asset_type', weight: 0.15 },
  { name: 'notes', weight: 0.15 },
];

export const GLOBAL_SEARCH_INV_TX_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'transaction_type', weight: 0.25 },
  { name: 'notes', weight: 0.35 },
  { name: 'currency', weight: 0.1 },
];

export const GLOBAL_SEARCH_INV_GOAL_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'name', weight: 0.45 },
  { name: 'description', weight: 0.3 },
  { name: 'status', weight: 0.15 },
  { name: 'priority', weight: 0.1 },
];
