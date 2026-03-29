import { ENTRY_TYPE_LABELS, type EntryType } from '../types/businessInvestment';

export function entryPostingTransactionType(type: EntryType): 'income' | 'expense' {
  return type === 'profit' || type === 'principal_return' ? 'income' : 'expense';
}

export function entryPostingDescription(type: EntryType, contractTitle: string, note?: string) {
  const base = `Investment — ${ENTRY_TYPE_LABELS[type]}: ${contractTitle}`;
  const n = note?.trim();
  return n ? `${base} (${n})` : base;
}
