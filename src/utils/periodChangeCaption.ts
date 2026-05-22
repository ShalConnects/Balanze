import {
  CASHFLOW_EXPENSE_TEXT_CLASS,
  CASHFLOW_INCOME_TEXT_CLASS,
  THEME_MUTED_CAPTION_CLASS,
} from '../constants/appThemeClasses';
import type { Transaction } from '../types';

export type CashflowKind = 'income' | 'expense';

export function sumByTypeInDateRange(
  transactions: Transaction[],
  type: CashflowKind,
  start: string | Date,
  end: string | Date,
): number {
  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  return transactions.reduce((sum, t) => {
    if (t.type !== type) return sum;
    const d = new Date(t.date);
    return d >= rangeStart && d <= rangeEnd ? sum + t.amount : sum;
  }, 0);
}

export function periodPercentChange(current: number, comparison: number): number | null {
  if (comparison === 0) return null;
  return Math.round(((current - comparison) / comparison) * 100);
}

export function formatArrowPercentChange(rate: number): string {
  if (rate === 0) return '0%';
  return `${rate > 0 ? '▲' : '▼'} ${Math.abs(rate)}%`;
}

const CASHFLOW_TREND_LABEL: Record<CashflowKind, [more: string, less: string, same: string]> = {
  income: ['Earning more', 'Earning less', 'Earning same'],
  expense: ['Spending more', 'Spending less', 'Spending same'],
};

export function cashflowChangeCaption(
  kind: CashflowKind,
  rate: number | null,
): { label: string; className: string } {
  if (rate === null) {
    return { label: 'No previous data', className: THEME_MUTED_CAPTION_CLASS };
  }
  const favorable = kind === 'income' ? rate > 0 : rate < 0;
  const trend =
    rate > 0 ? CASHFLOW_TREND_LABEL[kind][0] : rate < 0 ? CASHFLOW_TREND_LABEL[kind][1] : CASHFLOW_TREND_LABEL[kind][2];
  return {
    label: `${trend} (${formatArrowPercentChange(rate)})`,
    className:
      rate === 0
        ? THEME_MUTED_CAPTION_CLASS
        : favorable
          ? CASHFLOW_INCOME_TEXT_CLASS
          : CASHFLOW_EXPENSE_TEXT_CLASS,
  };
}
