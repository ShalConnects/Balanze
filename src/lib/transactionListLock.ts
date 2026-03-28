import type { Transaction } from '../types';
import { isLendBorrowTransaction } from '../utils/transactionUtils';

/** Set on inserts from BusinessInvestmentTracker; list page treats like externally managed. */
export const TRANSACTION_ORIGIN_BUSINESS_INVESTMENT = 'business_investment' as const;

export function isTransactionListActionsLocked(t: Transaction): boolean {
  return isLendBorrowTransaction(t) || t.origin === TRANSACTION_ORIGIN_BUSINESS_INVESTMENT;
}

/** Tooltip when Edit/Delete are disabled on the transactions list (tablet layout). */
export function getTransactionListManagedElsewhereHint(t: Transaction): string | null {
  if (isLendBorrowTransaction(t)) {
    return 'This transaction is managed by the Lend & Borrow page. Please make changes there instead.';
  }
  if (t.origin === TRANSACTION_ORIGIN_BUSINESS_INVESTMENT) {
    return 'This transaction is managed from the Investments page. Please make changes there instead.';
  }
  return null;
}
