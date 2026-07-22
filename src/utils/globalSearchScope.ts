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

/** Visual + keyboard order for result sections (transactions first). */
export const GLOBAL_SEARCH_RESULT_SECTION_ORDER = [
  'transactions',
  'accounts',
  'purchases',
  'lendBorrow',
  'investments',
  'clients',
  'transfers',
  'donations',
  'tasks',
  'invoices',
  'habits',
  'courses',
] as const;

export type GlobalSearchResultSection = (typeof GLOBAL_SEARCH_RESULT_SECTION_ORDER)[number];

export function globalSearchSectionCssOrder(section: GlobalSearchResultSection): number {
  return (GLOBAL_SEARCH_RESULT_SECTION_ORDER.indexOf(section) + 1) * 10;
}

/** Short keys used by GlobalSearchDropdown offset math — keep in sync with GLOBAL_SEARCH_RESULT_SECTION_ORDER. */
export const GLOBAL_SEARCH_NAV_KEYS = [
  'tx',
  'acc',
  'pur',
  'lb',
  'inv',
  'cli',
  'trf',
  'don',
  'tas',
  'invdoc',
  'hab',
  'cou',
] as const;

export type GlobalSearchNavKey = (typeof GLOBAL_SEARCH_NAV_KEYS)[number];

export function buildGlobalSearchOffsets(
  lengths: Record<GlobalSearchNavKey, number>
): Record<`${GlobalSearchNavKey}Start`, number> {
  let n = 0;
  const starts = {} as Record<`${GlobalSearchNavKey}Start`, number>;
  for (const key of GLOBAL_SEARCH_NAV_KEYS) {
    starts[`${key}Start`] = n;
    n += lengths[key];
  }
  return starts;
}

export function parseGlobalSearchQuery(rawQuery: string): { scope: GlobalSearchScope; query: string } {
  const trimmed = rawQuery.trim();
  const separatorIdx = trimmed.indexOf(':');
  if (separatorIdx <= 0) return { scope: 'all', query: trimmed };

  const prefix = trimmed.slice(0, separatorIdx).toLowerCase();
  const scope = SCOPE_PREFIXES[prefix];
  if (!scope) return { scope: 'all', query: trimmed };

  return { scope, query: trimmed.slice(separatorIdx + 1).trim() };
}
