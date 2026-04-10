import React from 'react';
import { Account, Transaction } from '../../types';
import { AccountDetailsContent } from './AccountDetailsContent';

export interface AccountExpandedInlineDetailsProps {
  account: Account;
  transactions: Transaction[];
  onPrintStatement: () => void;
}

/** Inline expanded row: transactions + account info (DPS lives in column info modal). */
export const AccountExpandedInlineDetails: React.FC<AccountExpandedInlineDetailsProps> = ({
  account,
  transactions,
  onPrintStatement,
}) => (
  <AccountDetailsContent
    variant="inline"
    account={account}
    transactions={transactions}
    onPrintStatement={onPrintStatement}
  />
);
