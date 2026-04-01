/** Fuse key weights for investment entities in global header search. */
export const GLOBAL_SEARCH_INV_ASSET_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'name', weight: 0.35 },
  { name: 'symbol', weight: 0.35 },
  { name: 'asset_type', weight: 0.15 },
  { name: 'notes', weight: 0.15 },
];

/** Denormalized on each row in global search: asset_symbol, asset_name from linked asset. */
export const GLOBAL_SEARCH_INV_TX_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'asset_symbol', weight: 0.28 },
  { name: 'asset_name', weight: 0.28 },
  { name: 'transaction_type', weight: 0.18 },
  { name: 'notes', weight: 0.18 },
  { name: 'currency', weight: 0.08 },
];

export const GLOBAL_SEARCH_INV_CATEGORY_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'name', weight: 0.5 },
  { name: 'description', weight: 0.35 },
  { name: 'icon', weight: 0.15 },
];

export const GLOBAL_SEARCH_BUSINESS_CONTRACT_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'title', weight: 1 },
];

export const GLOBAL_SEARCH_INV_GOAL_KEYS: Array<{ name: string; weight: number }> = [
  { name: 'name', weight: 0.45 },
  { name: 'description', weight: 0.3 },
  { name: 'status', weight: 0.15 },
  { name: 'priority', weight: 0.1 },
];
