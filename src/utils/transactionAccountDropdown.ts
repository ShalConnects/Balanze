import type { Account } from '../types';
import { getCurrencySymbol } from './currency';

/** Same eligibility, sort, and labels as the main transaction form account field. */
export function prepareAccountsForTransactionDropdown(
  accounts: Account[],
  defaultCurrency: string,
  alwaysIncludeAccountId?: string | null
): Account[] {
  let list = accounts.filter((a) => a.isActive && !a.name.includes('(DPS)'));
  if (alwaysIncludeAccountId) {
    const extra = accounts.find((a) => a.id === alwaysIncludeAccountId);
    if (extra && !extra.name.includes('(DPS)') && !list.some((a) => a.id === extra.id)) {
      list = [...list, extra];
    }
  }
  const dc = defaultCurrency?.trim() || 'USD';
  return list.sort((a, b) => {
    if (a.currency === dc && b.currency !== dc) return -1;
    if (a.currency !== dc && b.currency === dc) return 1;
    if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
    return (b.calculated_balance || 0) - (a.calculated_balance || 0);
  });
}

export function accountsToTransactionDropdownOptions(prepared: Account[]): { value: string; label: string }[] {
  return prepared.map((account) => ({
    value: account.id,
    label: `${account.name} (${getCurrencySymbol(account.currency)}${Number(account.calculated_balance || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })})`
  }));
}

/** Picks an id from `prepared` only: profile default if listed, else sole account, else first checking, else first row. */
export function resolveDefaultAccountIdForTransactionDropdown(
  prepared: Account[],
  profile?: { default_account_id?: string | null } | null
): string {
  if (prepared.length === 0) return '';
  const ids = new Set(prepared.map((a) => a.id));
  const def = profile?.default_account_id;
  if (def && ids.has(def)) return def;
  if (prepared.length === 1) return prepared[0].id;
  const checking = prepared.find((a) => a.type === 'checking');
  if (checking) return checking.id;
  return prepared[0].id;
}

export function buildTransactionAccountDropdownOptions(
  accounts: Account[],
  defaultCurrency: string,
  alwaysIncludeAccountId?: string | null
): { value: string; label: string }[] {
  return accountsToTransactionDropdownOptions(
    prepareAccountsForTransactionDropdown(accounts, defaultCurrency, alwaysIncludeAccountId)
  );
}
