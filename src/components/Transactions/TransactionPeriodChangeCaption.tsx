import React from 'react';
import type { Transaction } from '../../types';
import {
  cashflowChangeCaption,
  periodPercentChange,
  sumByTypeInDateRange,
  type CashflowKind,
} from '../../utils/periodChangeCaption';

const CAPTION_STYLE = { fontSize: '11px' } as const;

type Props = {
  kind: CashflowKind;
  transactions: Transaction[];
  rangeStart: string;
  rangeEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
};

export const TransactionPeriodChangeCaption: React.FC<Props> = ({
  kind,
  transactions,
  rangeStart,
  rangeEnd,
  comparisonStart,
  comparisonEnd,
}) => {
  const current = sumByTypeInDateRange(transactions, kind, rangeStart, rangeEnd);
  const comparison = sumByTypeInDateRange(transactions, kind, comparisonStart, comparisonEnd);
  const { label, className } = cashflowChangeCaption(kind, periodPercentChange(current, comparison));
  return (
    <p className={className} style={CAPTION_STYLE}>
      {label}
    </p>
  );
};
