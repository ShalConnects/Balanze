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

export const DEFAULT_SHOPPING_FREQUENCY_DAYS = 7;
export const DEFAULT_ITEM_DURATION_DAYS = 7;
export const SHOPPING_FREQUENCY_STORAGE_KEY = 'balanze_shopping_frequency_days';
export const SHOPPING_QUICK_CURRENCY_STORAGE_KEY = 'balanze_shopping_quick_currency';
export const SHOPPING_FREQUENCY_OPTIONS = [3, 7, 14, 21, 30] as const;

export const EXPENSE_NOTE_OPEN_TX_KEY = 'expenseNoteOpenTransactionId';

export const EXPENSE_NOTE_LOADING_LINES = [
  'Loading shopping list…',
  'Loading buying list…',
  'Raiding the pantry database…',
  'Teaching commas to behave…',
  'Convincing Toast it is not bread…',
  'Negotiating with the eggs…',
  'Almost done — unlike real checkout lines…',
  'Importing your past impulse buys…',
] as const;

export function queueOpenTransactionNote(transactionId: string): void {
  sessionStorage.setItem(EXPENSE_NOTE_OPEN_TX_KEY, transactionId);
}
