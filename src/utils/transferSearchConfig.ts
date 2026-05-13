export const TRANSFER_SEARCH_CONFIG = {
  threshold: 0.3,
  keys: [
    { name: 'fromAccount.name', weight: 0.3 },
    { name: 'toAccount.name', weight: 0.3 },
    { name: 'note', weight: 0.2 },
    { name: 'type', weight: 0.2 },
  ],
} as const;
