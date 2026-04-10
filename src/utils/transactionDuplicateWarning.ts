import { Transaction } from '../types';

export interface MonthlyDuplicateSummary {
  count: number;
  latestDate: string | null;
}

export function normalizeTransactionTitle(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMonthDateRange(dateString: string): { start: string; endExclusive: string } | null {
  const monthKey = (dateString || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  const toDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: toDate(start), endExclusive: toDate(end) };
}

export function summarizeMonthlyTitleDuplicates(
  transactions: Pick<Transaction, 'id' | 'description' | 'date'>[],
  title: string,
  dateString: string,
  excludeTransactionId?: string
): MonthlyDuplicateSummary | null {
  const normalizedTitle = normalizeTransactionTitle(title);
  const monthKey = (dateString || '').slice(0, 7);
  if (!normalizedTitle || !monthKey) return null;

  const matches = transactions.filter((tx) => {
    if (excludeTransactionId && tx.id === excludeTransactionId) return false;
    if ((tx.date || '').slice(0, 7) !== monthKey) return false;
    return normalizeTransactionTitle(tx.description || '') === normalizedTitle;
  });

  if (matches.length === 0) return null;

  const latestDate = matches.reduce<string | null>((latest, tx) => {
    const currentDate = (tx.date || '').slice(0, 10);
    if (!currentDate) return latest;
    if (!latest || currentDate > latest) return currentDate;
    return latest;
  }, null);

  return {
    count: matches.length,
    latestDate
  };
}
