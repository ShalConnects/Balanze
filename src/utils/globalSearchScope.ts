export type GlobalSearchScope =
  | 'all'
  | 'accounts'
  | 'transactions'
  | 'purchases'
  | 'transfers'
  | 'lendBorrow'
  | 'donations'
  | 'investments'
  | 'clients'
  | 'tasks'
  | 'invoices'
  | 'habits'
  | 'courses'
  | 'bonds';

const SCOPE_PREFIXES: Record<string, GlobalSearchScope> = {
  acc: 'accounts',
  account: 'accounts',
  txn: 'transactions',
  tx: 'transactions',
  transaction: 'transactions',
  purchase: 'purchases',
  transfer: 'transfers',
  lend: 'lendBorrow',
  borrow: 'lendBorrow',
  donation: 'donations',
  invest: 'investments',
  investment: 'investments',
  client: 'clients',
  task: 'tasks',
  invoice: 'invoices',
  habit: 'habits',
  course: 'courses',
  bond: 'bonds',
  bonds: 'bonds',
};

export const GLOBAL_SEARCH_PREFIX_HINTS = ['client:', 'txn:', 'invoice:', 'invest:', 'bond:'] as const;

export function parseGlobalSearchQuery(rawQuery: string): { scope: GlobalSearchScope; query: string } {
  const trimmed = rawQuery.trim();
  const separatorIdx = trimmed.indexOf(':');
  if (separatorIdx <= 0) return { scope: 'all', query: trimmed };

  const prefix = trimmed.slice(0, separatorIdx).toLowerCase();
  const scope = SCOPE_PREFIXES[prefix];
  if (!scope) return { scope: 'all', query: trimmed };

  return { scope, query: trimmed.slice(separatorIdx + 1).trim() };
}
