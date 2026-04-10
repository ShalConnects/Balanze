import React from 'react';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { AccountDpsTransferHistory, DpsTransferHistoryRow } from './AccountDpsTransferHistory';

export interface AccountDpsSettingsSidebarProps {
  account: Account;
  accounts: Account[];
  dpsSavingsAccount: Account | undefined;
  isDpsSavingsAccount: boolean;
  dpsTransfers: DpsTransferHistoryRow[];
  onManageDPS: (account: Account) => void;
  onDeleteDPS: (mainAccount: Account, dpsAccount: Account) => void | Promise<void>;
  /** Modal / compact: no top margin or outer border on the settings block */
  embedded?: boolean;
  /** When false, transfer history is omitted (e.g. rendered separately in a modal) */
  includeTransferHistory?: boolean;
  /** Hide duplicate Setup in "No DPS" state when a primary Setup exists above */
  suppressNoDpsSetupButton?: boolean;
}

export const AccountDpsSettingsSidebar: React.FC<AccountDpsSettingsSidebarProps> = ({
  account,
  accounts,
  dpsSavingsAccount,
  isDpsSavingsAccount,
  dpsTransfers,
  onManageDPS,
  onDeleteDPS,
  embedded = false,
  includeTransferHistory = true,
  suppressNoDpsSetupButton = false,
}) => {
  const wrapClass = embedded
    ? 'space-y-2'
    : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2';

  return (
    <>
      <div className={wrapClass}>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS Settings</h4>
        {account.has_dps ? (
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <div>
              <span className="font-medium">Type:</span> {account.dps_type}
            </div>
            <div>
              <span className="font-medium">Amount Type:</span> {account.dps_amount_type}
            </div>
            {account.dps_fixed_amount && (
              <div>
                <span className="font-medium">Fixed Amount:</span>{' '}
                {formatCurrency(account.dps_fixed_amount, account.currency)}
              </div>
            )}
            {dpsSavingsAccount && (
              <div>
                <span className="font-medium">Savings Account:</span> {dpsSavingsAccount.name}
              </div>
            )}
            <div className="pt-2 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onManageDPS(account)}
                className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
              >
                Manage DPS
              </button>
              <button
                type="button"
                onClick={() => onDeleteDPS(account, dpsSavingsAccount || account)}
                className="text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete DPS
              </button>
            </div>
          </div>
        ) : isDpsSavingsAccount ? (
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            {(() => {
              const mainAccount = accounts.find(a => a.dps_savings_account_id === account.id);
              if (mainAccount) {
                return (
                  <>
                    <div>
                      <span className="font-medium">DPS Type:</span>{' '}
                      {mainAccount.dps_type === 'monthly' ? 'Monthly' : 'Flexible'}
                    </div>
                    <div>
                      <span className="font-medium">Linked to:</span> {mainAccount.name}
                    </div>
                  </>
                );
              }
              return <div>DPS Savings Account</div>;
            })()}
          </div>
        ) : (
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <div>No DPS configured</div>
            {!suppressNoDpsSetupButton && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onManageDPS(account)}
                  className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                >
                  Setup DPS
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {includeTransferHistory && (
        <AccountDpsTransferHistory
          account={account}
          accounts={accounts}
          dpsSavingsAccount={dpsSavingsAccount}
          isDpsSavingsAccount={isDpsSavingsAccount}
          dpsTransfers={dpsTransfers}
        />
      )}
    </>
  );
};
