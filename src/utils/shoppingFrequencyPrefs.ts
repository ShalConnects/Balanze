import { DEFAULT_SHOPPING_FREQUENCY_DAYS, SHOPPING_FREQUENCY_STORAGE_KEY, SHOPPING_QUICK_CURRENCY_STORAGE_KEY } from '../constants/expenseNote';

export function getShoppingFrequencyDays(): number {
  try {
    const v = localStorage.getItem(SHOPPING_FREQUENCY_STORAGE_KEY);
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= 90 ? n : DEFAULT_SHOPPING_FREQUENCY_DAYS;
  } catch {
    return DEFAULT_SHOPPING_FREQUENCY_DAYS;
  }
}

export function setShoppingFrequencyDays(days: number): void {
  localStorage.setItem(SHOPPING_FREQUENCY_STORAGE_KEY, String(Math.min(90, Math.max(1, days))));
}

export function getShoppingQuickCurrency(fallback: string): string {
  try {
    return localStorage.getItem(SHOPPING_QUICK_CURRENCY_STORAGE_KEY)?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export function setShoppingQuickCurrency(currency: string): void {
  const c = currency.trim();
  if (c) localStorage.setItem(SHOPPING_QUICK_CURRENCY_STORAGE_KEY, c);
}
