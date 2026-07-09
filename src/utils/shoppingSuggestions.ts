import type { ExpenseNoteItem } from '../types/expenseNote';
import { DEFAULT_ITEM_DURATION_DAYS } from '../constants/expenseNote';

const MS_PER_DAY = 86_400_000;

export type ShoppingUrgency = 'out' | 'low' | 'ok';

export interface ShoppingSuggestion {
  item: ExpenseNoteItem;
  urgency: ShoppingUrgency;
  daysUntilRunOut: number;
  runOutDate: Date;
  durationDays: number;
}

function medianInt(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return DEFAULT_ITEM_DURATION_DAYS;
  return n % 2 === 1 ? s[(n - 1) / 2]! : Math.round((s[n / 2 - 1]! + s[n / 2]!) / 2);
}

function dayStartMs(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function purchaseDayMsList(dates: string[]): number[] {
  return [...new Set(dates.map(dayStartMs))].sort((a, b) => a - b);
}

export function estimateDurationDays(purchaseMs: number[], fallbackDays = DEFAULT_ITEM_DURATION_DAYS): number {
  if (purchaseMs.length < 2) return fallbackDays;
  const gaps: number[] = [];
  for (let i = 1; i < purchaseMs.length; i++) {
    gaps.push(Math.max(1, Math.round((purchaseMs[i]! - purchaseMs[i - 1]!) / MS_PER_DAY)));
  }
  return medianInt(gaps);
}

function urgencyFor(daysUntilRunOut: number): ShoppingUrgency {
  if (daysUntilRunOut < 0) return 'out';
  if (daysUntilRunOut <= 3) return 'low';
  return 'ok';
}

function datesForItem(item: ExpenseNoteItem, purchaseDates: Map<string, string[]>): number[] {
  const fromObs = purchaseDayMsList(purchaseDates.get(item.id) || []);
  if (item.last_purchased_at) {
    const last = dayStartMs(item.last_purchased_at);
    if (!fromObs.includes(last)) return [...fromObs, last].sort((a, b) => a - b);
  }
  return fromObs;
}

export function buildShoppingSuggestions(
  items: ExpenseNoteItem[],
  purchaseDates: Map<string, string[]>,
  frequencyDays: number,
  now = new Date()
): { suggestions: ShoppingSuggestion[]; nextShoppingDate: Date } {
  const todayMs = dayStartMs(now.toISOString());
  const nextShopMs = todayMs + frequencyDays * MS_PER_DAY;
  const nextShoppingDate = new Date(nextShopMs);

  const suggestions: ShoppingSuggestion[] = [];
  for (const item of items) {
    const purchaseMs = datesForItem(item, purchaseDates);
    if (!purchaseMs.length) continue;

    const lastMs = purchaseMs[purchaseMs.length - 1]!;
    const durationDays = estimateDurationDays(purchaseMs, frequencyDays);
    const runOutMs = lastMs + durationDays * MS_PER_DAY;
    if (runOutMs > nextShopMs) continue;

    const daysUntilRunOut = Math.round((runOutMs - todayMs) / MS_PER_DAY);
    suggestions.push({
      item,
      urgency: urgencyFor(daysUntilRunOut),
      daysUntilRunOut,
      runOutDate: new Date(runOutMs),
      durationDays,
    });
  }

  const rank: Record<ShoppingUrgency, number> = { out: 0, low: 1, ok: 2 };
  suggestions.sort(
    (a, b) => rank[a.urgency] - rank[b.urgency] || a.runOutDate.getTime() - b.runOutDate.getTime()
  );
  return { suggestions, nextShoppingDate };
}

export function estimateSuggestionsBudget(suggestions: ShoppingSuggestion[]): number | null {
  const prices = suggestions.map((s) => s.item.last_price).filter((p): p is number => p != null);
  return prices.length ? prices.reduce((a, b) => a + b, 0) : null;
}

export function formatSuggestionsShareText(
  suggestions: ShoppingSuggestion[],
  nextShoppingDate: Date
): string {
  const date = nextShoppingDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const lines = suggestions.map((s) => {
    const tag = s.urgency === 'out' ? '!' : s.urgency === 'low' ? '~' : '';
    const due =
      s.daysUntilRunOut < 0
        ? 'overdue'
        : s.daysUntilRunOut === 0
          ? 'today'
          : `in ${s.daysUntilRunOut}d`;
    return `${tag}${s.item.display_name} (${due})`.trim();
  });
  return [`Shop by ${date}`, '', ...lines].join('\n');
}

/** Plain-language help for the shopping trip UI. */
export function shoppingTripHelpLines(frequencyDays: number): string[] {
  return [
    `Items here may run out before your next shop (every ${frequencyDays} days).`,
    'Bought more than once: we use the gap between your buys.',
    `Bought only once: we assume about ${frequencyDays} days until we learn more.`,
    'Out = overdue · Low = next few days · Due = before next shop.',
    '✓ means you bought it today — updates predictions only, not transaction notes.',
  ];
}
