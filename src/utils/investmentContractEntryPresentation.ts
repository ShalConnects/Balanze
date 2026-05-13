import type { EntryType, InvestmentEntry } from '../types/businessInvestment';

export const chipClass: Record<EntryType, string> = {
  profit: 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-300',
  loss: 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-300',
  principal_return: 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
  capital_contribution: 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200'
};

export const amountClass: Record<EntryType, string> = {
  profit: 'text-green-600 dark:text-green-400',
  loss: 'text-red-600 dark:text-red-400',
  principal_return: 'text-gray-900 dark:text-white',
  capital_contribution: 'text-amber-600 dark:text-amber-500'
};

export function sortInvestmentEntriesByDateDesc(entries: InvestmentEntry[]): InvestmentEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function investmentEntryIsOutflow(type: EntryType): boolean {
  return type === 'loss' || type === 'capital_contribution';
}
