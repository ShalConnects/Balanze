import { MAX_TRANSACTION_NOTE_LENGTH } from './transactionNote';

export const EXPENSE_NOTE_RAW_MAX = MAX_TRANSACTION_NOTE_LENGTH;

export const SHOPPING_CATEGORY_SEEDS = [
  { slug: 'groceries', name: 'Groceries', sort_order: 0 },
  { slug: 'vegetables', name: 'Vegetables', sort_order: 1 },
  { slug: 'meat_protein', name: 'Meat & Protein', sort_order: 2 },
  { slug: 'household', name: 'Household', sort_order: 3 },
  { slug: 'uncategorized', name: 'Uncategorized', sort_order: 99 },
] as const;

export const EXPENSE_NOTE_AUTOCOMPLETE_LIMIT = 8;
export const EXPENSE_NOTE_ITEMS_PAGE_SIZE = 50;

export const EXPENSE_NOTE_OPEN_TX_KEY = 'expenseNoteOpenTransactionId';

export function queueOpenTransactionNote(transactionId: string): void {
  sessionStorage.setItem(EXPENSE_NOTE_OPEN_TX_KEY, transactionId);
}
