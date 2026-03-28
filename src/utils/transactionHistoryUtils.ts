import { format } from 'date-fns';
import { Transaction } from '../types';
import { isLendBorrowTransaction } from './transactionUtils';
import { formatCurrency } from './currency';

/** Row from `transaction_updates` — single source for store cache and UI. */
export type TransactionHistoryEntry = {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  updated_at: string;
  updated_by: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  amount: 'Amount',
  date: 'Date',
  description: 'Description',
  category: 'Category',
  type: 'Type',
  tags: 'Tags',
  account_id: 'Account',
  note: 'Note',
  is_recurring: 'Recurring',
  parent_recurring_id: 'Recurring parent',
  business_investment_contract_id: 'Investment',
};

export function transactionHistoryFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTagsDisplay(v: string | null): string {
  if (!v) return '—';
  const t = v.trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) return p.filter(Boolean).join(', ');
      if (p && typeof p === 'object') return Object.values(p).join(', ');
    } catch {
      /* fall through */
    }
  }
  return v;
}

function formatTypeValue(v: string | null): string {
  if (!v) return '—';
  if (v === 'income') return 'Income';
  if (v === 'expense') return 'Expense';
  return v;
}

/** Shared display for history cells (DRY between old/new). */
export function formatHistoryFieldValue(
  field: string,
  value: string | null,
  currency: string
): string {
  if (value === null || value === '') return '—';
  if (field === 'amount') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? formatCurrency(n, currency) : value;
  }
  if (field === 'date') {
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return value;
    }
  }
  if (field === 'type') return formatTypeValue(value);
  if (field === 'tags') return parseTagsDisplay(value);
  if (field === 'is_recurring') return value === 'true' ? 'Yes' : value === 'false' ? 'No' : value;
  return value;
}

export function formatHistoryActorLabel(updatedBy: string | null, currentUserId: string | undefined): string | null {
  if (!updatedBy) return null;
  if (currentUserId && updatedBy === currentUserId) return 'You';
  return 'Another user';
}

const toDateStr = (d: Date | string) => (typeof d === 'string' ? d : d.toISOString()).split('T')[0];

type Contrib = { date: string; amount: number; type: 'income' | 'expense' };

/** Build date-attributed contributions from transaction + history (amount + date edits, chronological). */
function getContributions(t: Transaction, history: Pick<TransactionHistoryEntry, 'field_name' | 'old_value' | 'new_value' | 'updated_at'>[]): Contrib[] {
  if (!history.length) return [{ date: toDateStr(t.date), amount: t.amount, type: t.type }];

  const events = history
    .filter((h) => h.field_name === 'amount' || h.field_name === 'date')
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  if (!events.length) return [{ date: toDateStr(t.date), amount: t.amount, type: t.type }];

  const first = events[0];
  let startD = toDateStr(t.date);
  let startA = t.amount;
  if (first.field_name === 'date' && first.old_value) {
    startD = toDateStr(first.old_value);
    startA = t.amount;
  } else if (first.field_name === 'amount' && first.old_value != null) {
    startA = parseFloat(first.old_value);
    startD = toDateStr(t.date);
  }

  const out: Contrib[] = [{ date: startD, amount: startA, type: t.type }];
  let curAmt = startA;
  let curDate = startD;

  for (const h of events) {
    if (h.field_name === 'amount') {
      const oldVal = parseFloat(h.old_value || '0');
      const newVal = parseFloat(h.new_value || '0');
      out.push({ date: toDateStr(h.updated_at), amount: newVal - oldVal, type: t.type });
      curAmt = newVal;
    } else {
      const oldD = toDateStr(h.old_value || curDate);
      const newD = toDateStr(h.new_value || curDate);
      out.push({ date: oldD, amount: -curAmt, type: t.type });
      out.push({ date: newD, amount: curAmt, type: t.type });
      curDate = newD;
    }
  }
  return out;
}

/** Show edit-history affordance when DB has audit rows or row was modified (timestamps). */
export function transactionHasAuditTrail(
  transaction: { transaction_id?: string; updated_at?: string; created_at: string },
  cache: Map<string, TransactionHistoryEntry[]> | undefined
): boolean {
  const tid = transaction.transaction_id || '';
  if (tid && (cache?.get(tid)?.length ?? 0) > 0) return true;
  return Boolean(transaction.updated_at && transaction.updated_at !== transaction.created_at);
}

export function computeDateAwareTotals(
  transactions: Transaction[],
  historyMap: Map<string, Pick<TransactionHistoryEntry, 'field_name' | 'old_value' | 'new_value' | 'updated_at'>[]>,
  startDate: Date,
  endDate: Date
): { income: number; expense: number } {
  const start = toDateStr(startDate);
  const end = toDateStr(endDate);
  let income = 0;
  let expense = 0;
  const excluded = (t: Transaction) =>
    t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')) || isLendBorrowTransaction(t);
  transactions
    .filter((t) => !excluded(t))
    .forEach((t) => {
      const contribs = getContributions(t, historyMap.get(t.transaction_id || '') || []);
      contribs.forEach(({ date, amount, type }) => {
        const d = toDateStr(date);
        if (d >= start && d <= end) {
          if (type === 'income') income += amount;
          else expense += amount;
        }
      });
    });
  return { income, expense };
}
