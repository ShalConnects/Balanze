import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

export interface DescriptionSuggestionItem {
  text: string;
  type?: 'income' | 'expense';
  category?: string;
  account_id?: string;
  amount?: number;
  purchase_status?: 'planned' | 'purchased' | 'cancelled';
}

export function useDescriptionSuggestions(input: string, maxResults: number = 8): string[] {
  return useDescriptionSuggestionItems(input, maxResults).map(item => item.text);
}

export function useDescriptionSuggestionItems(input: string, maxResults: number = 8): DescriptionSuggestionItem[] {
  const { transactions, purchases } = useFinanceStore();
  const [debouncedInput, setDebouncedInput] = useState(input);

  // Debounce input to reduce rapid recomputation
  useEffect(() => {
    const id = setTimeout(() => setDebouncedInput(input), 180);
    return () => clearTimeout(id);
  }, [input]);

  return useMemo(() => {
    const query = (debouncedInput || '').trim().toLowerCase();
    if (query.length < 1) return [];

    // Collect unique descriptions from both transactions and purchases
    const uniqueDescriptions = new Map<string, {
      text: string;
      count: number;
      recentIndex: number;
      type?: 'income' | 'expense';
      category?: string;
      account_id?: string;
      amount?: number;
      purchase_status?: 'planned' | 'purchased' | 'cancelled';
    }>();

    // Process transactions
    for (let i = 0; i < transactions.length; i += 1) {
      const desc = transactions[i]?.description || '';
      const tags = transactions[i]?.tags || [];
      // Exclude transfers
      const isTransfer = tags.some((t: string) => t === 'transfer' || t.startsWith('dps_transfer'));
      if (isTransfer) continue;
      if (!desc) continue;
      const key = desc;
      const existing = uniqueDescriptions.get(key);
      if (existing) {
        existing.count += 1;
        // Keep the most recent index (larger i) to bias recent usage
        if (i > existing.recentIndex) {
          existing.recentIndex = i;
          existing.type = transactions[i]?.type;
          existing.category = transactions[i]?.category;
          existing.account_id = transactions[i]?.account_id;
          existing.amount = Number(transactions[i]?.amount) || existing.amount;
        }
      } else {
        uniqueDescriptions.set(key, {
          text: desc,
          count: 1,
          recentIndex: i,
          type: transactions[i]?.type,
          category: transactions[i]?.category,
          account_id: transactions[i]?.account_id,
          amount: Number(transactions[i]?.amount) || undefined,
        });
      }
    }

    // Process purchases (starting index after transactions)
    const transactionCount = transactions.length;
    for (let i = 0; i < purchases.length; i += 1) {
      const itemName = purchases[i]?.item_name || '';
      if (!itemName) continue;
      const key = itemName;
      const existing = uniqueDescriptions.get(key);
      if (existing) {
        existing.count += 1;
        // Keep the most recent index (larger i) to bias recent usage
        if (i > existing.recentIndex) {
          existing.recentIndex = i;
          existing.category = purchases[i]?.category;
          existing.purchase_status = purchases[i]?.status;
          existing.account_id = (purchases[i] as any)?.account_id || existing.account_id;
          existing.amount = Number((purchases[i] as any)?.price) || existing.amount;
        }
      } else {
        uniqueDescriptions.set(key, {
          text: itemName,
          count: 1,
          recentIndex: transactionCount + i,
          category: purchases[i]?.category,
          purchase_status: purchases[i]?.status,
          account_id: (purchases[i] as any)?.account_id,
          amount: Number((purchases[i] as any)?.price) || undefined,
        });
      }
    }

    // Filter by query
    const candidates = Array.from(uniqueDescriptions.values()).filter(({ text }) =>
      text.toLowerCase().includes(query)
    );

    // Prioritize: prefix > word-prefix > contains; then by frequency; then by recency
    const lower = (s: string) => s.toLowerCase();
    const isWordPrefix = (text: string) => {
      const words = lower(text).split(/[^a-z0-9]+/i).filter(Boolean);
      return words.some(w => w.startsWith(query));
    };

    const startsWith = candidates.filter(c => lower(c.text).startsWith(query));
    const wordPrefix = candidates.filter(c => !lower(c.text).startsWith(query) && isWordPrefix(c.text));
    const contains = candidates.filter(c => !lower(c.text).startsWith(query) && !isWordPrefix(c.text));

    const rank = (a: { count: number; recentIndex: number }, b: { count: number; recentIndex: number }) => {
      if (b.count !== a.count) return b.count - a.count; // higher frequency first
      return b.recentIndex - a.recentIndex; // more recent first (larger index)
    };

    startsWith.sort(rank);
    wordPrefix.sort(rank);
    contains.sort(rank);

    const ordered = [...startsWith, ...wordPrefix, ...contains]
      .map(c => ({
        text: c.text,
        type: c.type,
        category: c.category,
        account_id: c.account_id,
        amount: c.amount,
        purchase_status: c.purchase_status,
      }))
      .slice(0, maxResults);

    return ordered;
  }, [debouncedInput, maxResults, transactions, purchases]);
}
