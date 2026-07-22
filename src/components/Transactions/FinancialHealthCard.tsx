import React from 'react';
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { INCOME_EXPENSE_NET_TOOLTIP } from '../../utils/transactionUtils';
import {
  CASHFLOW_EXPENSE_TEXT_CLASS,
  CASHFLOW_INCOME_TEXT_CLASS,
  THEME_ACCENT_TEXT_CLASS,
  THEME_BRAND_GRADIENT_TEXT_CLASS,
  THEME_MUTED_CAPTION_CLASS,
} from '../../constants/appThemeClasses';
import { SummaryLabelWithInfo } from '../common/SummaryLabelWithInfo';

interface FinancialHealthCardProps {
  selectedCurrency: string;
  income: number;
  expense: number;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  selectedCurrency,
  income,
  expense
}) => {
  const netAmount = income - expense;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <SummaryLabelWithInfo label="Net" tooltip={INCOME_EXPENSE_NET_TOOLTIP} />
          <p className={THEME_BRAND_GRADIENT_TEXT_CLASS} style={{ fontSize: '1.2rem' }}>
            {formatCurrency(netAmount, selectedCurrency)}
          </p>
          <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
            <span className={CASHFLOW_INCOME_TEXT_CLASS}>
              {formatCurrency(income, selectedCurrency)}
            </span>
            <span className="mx-1">/</span>
            <span className={CASHFLOW_EXPENSE_TEXT_CLASS}>
              {formatCurrency(expense, selectedCurrency)}
            </span>
          </p>
        </div>
        <TrendingDown className={THEME_ACCENT_TEXT_CLASS} style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
      </div>
    </div>
  );
};
