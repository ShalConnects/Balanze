/** Shared by TransactionNoteModal and TransactionForm. */
export const MAX_TRANSACTION_NOTE_LENGTH = 500;

export const TRANSACTION_NOTE_PLACEHOLDER = `Comma-separated items, e.g. Citi 1700, Chicken 218x160 (max ${MAX_TRANSACTION_NOTE_LENGTH} chars)…`;

/** Show live counter at/above this length (90% of max). */
export const TRANSACTION_NOTE_COUNTER_THRESHOLD = Math.ceil(MAX_TRANSACTION_NOTE_LENGTH * 0.9);

export const shouldShowTransactionNoteCounter = (length: number) =>
  length >= TRANSACTION_NOTE_COUNTER_THRESHOLD;
