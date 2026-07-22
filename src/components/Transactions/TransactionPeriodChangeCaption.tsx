import React from 'react';
import type { Transaction } from '../../types';
import {
  cashflowChangeCaption,
  periodPercentChange,
  sumByTypeInDateRange,
  type CashflowKind,
} from '../../utils/periodChangeCaption';
import { computeDateAwareTotals, type TransactionHistoryEntry } from '../../utils/transactionHistoryUtils';

const CAPTION_STYLE = { fontSize: '11px' } as const;

type Props = {
  kind: CashflowKind;
  transactions: Transaction[];
  rangeStart: string;
  rangeEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  /** Keep caption aligned with the summary card value. */
  currentTotal?: number;
  /** When set, comparison (and current if currentTotal omitted) use edit-aware attribution. */
  historyMap?: Map<string, Pick<TransactionHistoryEntry, 'field_name' | 'old_value' | 'new_value' | 'updated_at'>[]>;
};

export const TransactionPeriodChangeCaption: React.FC<Props> = ({
  kind,
  transactions,
  rangeStart,
  rangeEnd,
  comparisonStart,
  comparisonEnd,
  currentTotal,
  historyMap,
}) => {
  const periodSum = (start: string, end: string) =>
    historyMap
      ? computeDateAwareTotals(transactions, historyMap, start, end)[kind]
      : sumByTypeInDateRange(transactions, kind, start, end);
  const current = currentTotal ?? periodSum(rangeStart, rangeEnd);
  const comparison = periodSum(comparisonStart, comparisonEnd);
  const { label, className } = cashflowChangeCaption(kind, periodPercentChange(current, comparison));
  return (
    <p className={className} style={CAPTION_STYLE}>
      {label}
    </p>
  );
};
