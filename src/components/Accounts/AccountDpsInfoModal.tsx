import React, { useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { Info, X } from 'lucide-react';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { AccountDpsSettingsSidebar } from './AccountDpsSettingsSidebar';
import { AccountDpsTransferHistory, DpsTransferHistoryRow } from './AccountDpsTransferHistory';

export interface AccountDpsInfoModalProps {
  account: Account | null;
  accounts: Account[];
  dpsTransfers: DpsTransferHistoryRow[];
  onClose: () => void;
  onManageDPS: (account: Account) => void;
  onDeleteDPS: (mainAccount: Account, dpsAccount: Account) => void | Promise<void>;
  /** Main DPS account id (for dropdown preset); closes info modal before opening transfer */
  onOpenDpsTransfer?: (mainDpsAccountId: string) => void;
}

export const AccountDpsInfoModal: React.FC<AccountDpsInfoModalProps> = ({
  account,
  accounts,
  dpsTransfers,
  onClose,
  onManageDPS,
  onDeleteDPS,
  onOpenDpsTransfer,
}) => {
  const dpsSavingsAccount = useMemo(
    () => (account ? accounts.find(a => a.id === account.dps_savings_account_id) : undefined),
    [account, accounts]
  );
  const isDpsSavingsAccount = useMemo(
    () => (account ? accounts.some(a => a.dps_savings_account_id === account.id) : false),
    [account, accounts]
  );
  const mainDpsIdForTransfer = useMemo(
    () =>
      !account
        ? undefined
        : account.has_dps && account.dps_savings_account_id
          ? account.id
          : accounts.find(a => a.dps_savings_account_id === account.id)?.id,
    [account, accounts]
  );

  if (!account) return null;

  const showTopSetup = !account.has_dps && !isDpsSavingsAccount;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex-shrink-0 flex items-start justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">DPS</Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{account.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {showTopSetup && (
              <button
                type="button"
                onClick={() => {
                  onManageDPS(account);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:bg-gradient-primary-hover transition-colors"
              >
                Setup DPS
              </button>
            )}
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1.5 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Initial balance:</span>{' '}
                {formatCurrency(Number(account.initial_balance), account.currency)}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Current balance:</span>{' '}
                {formatCurrency(account.calculated_balance || 0, account.currency)}
              </div>
              {account.has_dps && dpsSavingsAccount && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">DPS savings balance:</span>{' '}
                  {formatCurrency(dpsSavingsAccount.calculated_balance || 0, dpsSavingsAccount.currency)}
                </div>
              )}
            </div>
            <AccountDpsSettingsSidebar
              account={account}
              accounts={accounts}
              dpsSavingsAccount={dpsSavingsAccount}
              isDpsSavingsAccount={isDpsSavingsAccount}
              dpsTransfers={dpsTransfers}
              onManageDPS={a => {
                onManageDPS(a);
                onClose();
              }}
              onDeleteDPS={async (m, d) => {
                onClose();
                await onDeleteDPS(m, d);
              }}
              embedded
              includeTransferHistory={false}
              suppressNoDpsSetupButton={showTopSetup}
            />
            <AccountDpsTransferHistory
              account={account}
              accounts={accounts}
              dpsSavingsAccount={dpsSavingsAccount}
              isDpsSavingsAccount={isDpsSavingsAccount}
              dpsTransfers={dpsTransfers}
              embedded
              onDpsTransfer={
                mainDpsIdForTransfer && onOpenDpsTransfer
                  ? () => onOpenDpsTransfer(mainDpsIdForTransfer)
                  : undefined
              }
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

/** DPS column / row trigger: gray when off, solid blue when `has_dps` */
export const AccountDpsInfoTrigger: React.FC<{ onOpen: () => void; dpsActive?: boolean }> = ({ onOpen, dpsActive }) => (
  <div className="flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
    <button
      type="button"
      onClick={() => onOpen()}
      className={
        dpsActive
          ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-md transition-colors'
          : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md transition-colors'
      }
      title="DPS details"
      aria-label="DPS details"
    >
      <Info className="w-4 h-4" />
    </button>
  </div>
);
