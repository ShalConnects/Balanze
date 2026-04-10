import React from 'react';
import { Account, Transaction } from '../../types';
import { AccountDetailsContent } from './AccountDetailsContent';

interface AccountDetailsModalProps {
  account: Account;
  transactions: Transaction[];
  onClose: () => void;
  onPrintStatement: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ account, transactions, onClose, onPrintStatement }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:items-start lg:pt-16">
    <div className="fixed inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
    <div className="relative z-10 w-full flex justify-center px-0 sm:px-2" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <AccountDetailsContent variant="modal" account={account} transactions={transactions} onPrintStatement={onPrintStatement} onClose={onClose} />
    </div>
  </div>
);
