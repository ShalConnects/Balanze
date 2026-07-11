import type { ExpenseNoteCategory, ExpenseNoteEntrySummary, ExpenseNoteItem } from '../types/expenseNote';
import { getShoppingFrequencyDays } from './shoppingFrequencyPrefs';
import { countDueShoppingItems } from './shoppingSuggestions';

export type ShoppingListSnapshot = {
  categories: ExpenseNoteCategory[];
  items: ExpenseNoteItem[];
  recentEntries: ExpenseNoteEntrySummary[];
  purchaseDates: Map<string, string[]>;
};

const cache = new Map<string, ShoppingListSnapshot>();
let dueCount = 0;
const dueListeners = new Set<() => void>();

function publishDueCount(n: number) {
  if (dueCount === n) return;
  dueCount = n;
  dueListeners.forEach((l) => l());
}

export function getShoppingListCache(userId: string): ShoppingListSnapshot | null {
  return cache.get(userId) ?? null;
}

export function setShoppingListCache(userId: string, snap: ShoppingListSnapshot): void {
  cache.set(userId, snap);
  publishDueCount(countDueShoppingItems(snap.items, snap.purchaseDates, getShoppingFrequencyDays()));
}

export function setShoppingDueCount(n: number): void {
  publishDueCount(Math.max(0, n));
}

export function getShoppingDueCount(): number {
  return dueCount;
}

export function subscribeShoppingDueCount(onStoreChange: () => void): () => void {
  dueListeners.add(onStoreChange);
  return () => {
    dueListeners.delete(onStoreChange);
  };
}

/** Recompute badge from cache after frequency changes (no network). */
export function refreshShoppingDueCountFromCache(userId: string): void {
  const snap = cache.get(userId);
  if (!snap) return;
  publishDueCount(countDueShoppingItems(snap.items, snap.purchaseDates, getShoppingFrequencyDays()));
}
