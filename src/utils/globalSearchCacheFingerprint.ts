/** Row count + newest timestamp — shared so list/global search caches invalidate on edits. */
export function collectionFingerprint(rows: readonly unknown[] | null | undefined): string {
  return segment(rows);
}

/** One slice: row count + newest timestamp so global search cache invalidates when any source loads or edits. */
function segment(rows: readonly unknown[] | null | undefined): string {
  const list = rows ?? [];
  let max = '';
  for (const r of list) {
    const o = r as Record<string, unknown>;
    const u = String(
      o.updated_at ?? o.created_at ?? o.date ?? o.transaction_date ?? ''
    );
    if (u > max) max = u;
  }
  return `${list.length}:${max}`;
}

export interface GlobalSearchCacheSources {
  transactions: readonly unknown[] | null | undefined;
  accounts: readonly unknown[] | null | undefined;
  purchases: readonly unknown[] | null | undefined;
  lendBorrowRecords: readonly unknown[] | null | undefined;
  donationSavingRecords: readonly unknown[] | null | undefined;
  clients: readonly unknown[] | null | undefined;
  tasks: readonly unknown[] | null | undefined;
  invoices: readonly unknown[] | null | undefined;
  habits: readonly unknown[] | null | undefined;
  courses: readonly unknown[] | null | undefined;
  investmentAssets: readonly unknown[] | null | undefined;
  investmentTransactions: readonly unknown[] | null | undefined;
  investmentGoals: readonly unknown[] | null | undefined;
  investmentCategories: readonly unknown[] | null | undefined;
  businessInvestmentContracts: readonly unknown[] | null | undefined;
  prizeBonds: readonly unknown[] | null | undefined;
  transfers: readonly unknown[] | null | undefined;
  dpsTransfers: readonly unknown[] | null | undefined;
}

export function globalSearchCacheFingerprint(s: GlobalSearchCacheSources): string {
  return [
    segment(s.transactions),
    segment(s.accounts),
    segment(s.purchases),
    segment(s.lendBorrowRecords),
    segment(s.donationSavingRecords),
    segment(s.clients),
    segment(s.tasks),
    segment(s.invoices),
    segment(s.habits),
    segment(s.courses),
    segment(s.investmentAssets),
    segment(s.investmentTransactions),
    segment(s.investmentGoals),
    segment(s.investmentCategories),
    segment(s.businessInvestmentContracts),
    segment(s.prizeBonds),
    segment(s.transfers),
    segment(s.dpsTransfers),
  ].join('\x1e');
}
