/** Zakah (Zakat) calculation – nisab and 2.5% of zakatable wealth. */

/** Minimal transaction shape for balance-at-date (DRY, no store dependency). Expects date as ISO or YYYY-MM-DD. */
export interface TxForBalance {
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
}

/** Nisab thresholds in USD (approximate; gold ~85g, silver ~595g). */
export const NISAB_USD = {
  gold: 5500,
  silver: 450,
} as const;

export const ZAKAT_RATE = 0.025;

export type NisabType = keyof typeof NISAB_USD;

const NISAB_BY_CURRENCY: Record<string, { gold: number; silver: number }> = {
  USD: NISAB_USD,
  BDT: { gold: 605_000, silver: 49_500 },
  EUR: { gold: 5060, silver: 414 },
  GBP: { gold: 4320, silver: 354 },
};

export const NISAB_SUPPORTED_CURRENCIES = Object.keys(NISAB_BY_CURRENCY);

export function getNisabThreshold(type: NisabType, currency: string = 'USD'): number {
  const byCurr = NISAB_BY_CURRENCY[currency] || NISAB_USD;
  return byCurr[type];
}

export function computeZakat(
  totalZakatable: number,
  nisabType: NisabType,
  currency: string = 'USD'
): { aboveNisab: boolean; nisab: number; zakatDue: number } {
  const nisab = getNisabThreshold(nisabType, currency);
  const aboveNisab = totalZakatable >= nisab;
  const zakatDue = aboveNisab ? totalZakatable * ZAKAT_RATE : 0;
  return { aboveNisab, nisab, zakatDue };
}

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);
const toDateOnlyStr = (s: string) => (s || '').slice(0, 10);

/** Balance of one account at a given date from initial_balance + transactions (income − expense) up to that date. */
export function getAccountBalanceAtDate(
  accountId: string,
  initialBalance: number,
  accountCreatedAt: string,
  transactions: TxForBalance[],
  asOfDate: Date
): number {
  const asOfStr = toDateOnly(asOfDate);
  const createdStr = toDateOnlyStr(accountCreatedAt);
  if (createdStr && asOfStr < createdStr) return 0;
  const relevant = transactions.filter(
    (t) => t.account_id === accountId && t.date && toDateOnlyStr(t.date) <= asOfStr
  );
  const delta = relevant.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
  return initialBalance + delta;
}

/** Per-account zakatable = min(current balance, balance one Islamic year ago). */
export function getZakatableFromAccounts(
  accounts: { id: string; initial_balance: number; calculated_balance: number; created_at: string }[],
  transactions: TxForBalance[],
  asOfDate: Date,
  includedIds: Set<string>
): { total: number; perAccount: { id: string; current: number; heldOneYear: number; zakatable: number }[] } {
  const perAccount: { id: string; current: number; heldOneYear: number; zakatable: number }[] = [];
  let total = 0;
  for (const acc of accounts) {
    if (!includedIds.has(acc.id)) continue;
    const current = acc.calculated_balance ?? 0;
    const heldOneYear = getAccountBalanceAtDate(
      acc.id,
      acc.initial_balance ?? 0,
      acc.created_at,
      transactions,
      asOfDate
    );
    const zakatable = Math.max(0, Math.min(current, Math.max(0, heldOneYear)));
    perAccount.push({ id: acc.id, current, heldOneYear, zakatable });
    total += zakatable;
  }
  return { total, perAccount };
}
