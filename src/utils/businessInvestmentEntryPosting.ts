import { ENTRY_TYPE_LABELS, type EntryType } from '../types/businessInvestment';

export function entryPostingTransactionType(type: EntryType): 'income' | 'expense' {
  return type === 'profit' || type === 'principal_return' ? 'income' : 'expense';
}

/** Loss writes off capital already sent; cash posting is opt-in via account. */
export function entryPostsCashByDefault(type: EntryType): boolean {
  return type !== 'loss';
}

export function shouldPostEntryTransaction(type: EntryType, postChecked: boolean, accountId: string): boolean {
  return Boolean(accountId) && (entryPostsCashByDefault(type) ? postChecked : true);
}

export function entryPostingDescription(type: EntryType, contractTitle: string, note?: string) {
  const base = `Investment — ${ENTRY_TYPE_LABELS[type]}: ${contractTitle}`;
  const n = note?.trim();
  return n ? `${base} (${n})` : base;
}
