import React, { useMemo, useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { computeZakat, getZakatableFromAccounts, type NisabType, type TxForBalance } from '../utils/zakah';
import { getDateOneIslamicYearAgo } from '../utils/islamicCalendar';
import { CustomDropdown } from '../components/Purchases/CustomDropdown';
import { Wallet, Plus, Minus } from 'lucide-react';
import type { Account } from '../types';

const FORM_CONTROL =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
const CHECKBOX_CLASS =
  'rounded border-gray-300 dark:border-gray-600 accent-blue-600 dark:accent-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0';
const DROPDOWN_BTN =
  'bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 text-gray-700 dark:text-gray-200 text-sm h-9 min-h-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-3 py-2 w-full';
const DROPDOWN_MENU = '!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-600 !shadow-lg';
const NISAB_OPTIONS: { value: NisabType; label: string }[] = [{ value: 'gold', label: 'Gold' }, { value: 'silver', label: 'Silver' }];
const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4';
const SECTION_CARD = `flex flex-col min-h-0 ${CARD}`;
const RESULT_CARD = 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4';
const SEP = 'border-blue-200/50 dark:border-blue-800/50';
const numInput = (val: number, set: (n: number) => void, className = `mt-1 ${FORM_CONTROL}`) =>
  ({ type: 'number' as const, min: 0, step: 0.01, value: val || '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value) || 0), className });

export const ZakahPage: React.FC = () => {
  const { profile } = useAuthStore();
  const { accounts, transactions, fetchAccounts, fetchTransactions } = useFinanceStore();
  const [displayCurrency, setDisplayCurrency] = useState('');
  const [nisabType, setNisabType] = useState<NisabType>('silver');
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set());
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [otherAssets, setOtherAssets] = useState(0);
  const [debts, setDebts] = useState(0);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]);

  const accountCurrencies = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.currency))).sort(),
    [accounts]
  );
  const availableCurrencies = useMemo(() => {
    if (profile?.selected_currencies?.length) {
      return accountCurrencies.filter((c) => profile.selected_currencies?.includes(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const currencyOptions = useMemo(
    () => availableCurrencies.map((c) => ({ value: c, label: c })),
    [availableCurrencies]
  );

  useEffect(() => {
    if (availableCurrencies.length === 0) return;
    if (!displayCurrency || !availableCurrencies.includes(displayCurrency)) {
      const defaultCurr = profile?.local_currency && availableCurrencies.includes(profile.local_currency)
        ? profile.local_currency
        : availableCurrencies[0];
      setDisplayCurrency(defaultCurr);
    }
  }, [availableCurrencies, displayCurrency, profile?.local_currency]);

  const accountsInCurrency = useMemo(
    () => accounts.filter((a) => a.currency === displayCurrency && a.isActive),
    [accounts, displayCurrency]
  );

  useEffect(() => {
    setIncludedIds(new Set(accountsInCurrency.map((a) => a.id)));
  }, [displayCurrency, accountsInCurrency]);

  const toggleAccount = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const oneYearAgo = useMemo(() => getDateOneIslamicYearAgo(), []);
  const txForBalance: TxForBalance[] = useMemo(
    () => (transactions || []).map((t) => ({ account_id: t.account_id, type: t.type, amount: t.amount, date: t.date })),
    [transactions]
  );
  const { total: totalFromAccountsHeldOneYear, perAccount: zakatablePerAccount } = useMemo(
    () =>
      getZakatableFromAccounts(
        accountsInCurrency,
        txForBalance,
        oneYearAgo,
        includedIds
      ),
    [accountsInCurrency, txForBalance, oneYearAgo, includedIds]
  );
  const curr = displayCurrency || 'USD';
  const additions = gold + silver + otherAssets;
  const totalZakatable = totalFromAccountsHeldOneYear + additions - Math.max(0, debts);
  const { aboveNisab, nisab, zakatDue } = computeZakat(Math.max(0, totalZakatable), nisabType, curr);
  const zakatableByAccountId = useMemo(
    () => new Map(zakatablePerAccount.map((p) => [p.id, p])),
    [zakatablePerAccount]
  );

  return (
    <div className="dark:bg-gray-900 min-h-full">
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 max-w-full overflow-x-hidden">
        <section className={RESULT_CARD}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-4 flex flex-col justify-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display currency
                {currencyOptions.length > 0 ? (
                  <CustomDropdown
                    options={currencyOptions}
                    value={displayCurrency}
                    onChange={setDisplayCurrency}
                    placeholder="Select currency"
                    className={`mt-1 ${DROPDOWN_BTN}`}
                    dropdownMenuClassName={DROPDOWN_MENU}
                  />
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add accounts to see currencies.</p>
                )}
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nisab basis
                <CustomDropdown
                  options={NISAB_OPTIONS}
                  value={nisabType}
                  onChange={(v) => setNisabType(v as NisabType)}
                  className={`mt-1 ${DROPDOWN_BTN}`}
                  dropdownMenuClassName={DROPDOWN_MENU}
                />
              </label>
            </div>
            <div className={`space-y-2 text-sm pt-4 border-t ${SEP} lg:border-t-0 lg:pt-0 lg:border-l ${SEP} lg:pl-6`}>
              <p className="text-gray-600 dark:text-gray-400">From accounts (held 1+ Islamic year): <strong className="text-gray-900 dark:text-white">{formatCurrency(totalFromAccountsHeldOneYear, curr)}</strong></p>
              <p className="text-gray-600 dark:text-gray-400">+ Additions (gold, silver, other): <strong className="text-gray-900 dark:text-white">{formatCurrency(additions, curr)}</strong></p>
              <p className="text-gray-600 dark:text-gray-400">− Debts: <strong className="text-gray-900 dark:text-white">{formatCurrency(Math.max(0, debts), curr)}</strong></p>
              <p className={`text-gray-700 dark:text-gray-300 pt-1 border-t ${SEP}`}>Total zakatable: <strong className="text-gray-900 dark:text-white">{formatCurrency(Math.max(0, totalZakatable), curr)}</strong></p>
              <p className="text-gray-600 dark:text-gray-400">Nisab ({nisabType}): {formatCurrency(nisab, curr)}</p>
              <p className={aboveNisab ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-amber-600 dark:text-amber-400'}>
                {aboveNisab ? 'Above nisab' : 'Below nisab'} — Zakat due (2.5%): <strong>{formatCurrency(zakatDue, curr)}</strong>
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 h-[260px] sm:h-[300px] lg:h-[340px]">
          <section className={`${SECTION_CARD} overflow-hidden`}>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
              <Wallet className="w-4 h-4" /> From your accounts ({displayCurrency || '—'})
            </h2>
            <ul className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {accountsInCurrency.length === 0 ? (
                <li className="text-sm text-gray-500 dark:text-gray-400">No accounts in this currency.</li>
              ) : (
                accountsInCurrency.map((acc: Account) => {
                  const z = zakatableByAccountId.get(acc.id);
                  return (
                    <li key={acc.id} className="flex flex-col gap-0.5 py-2 sm:py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex flex-wrap items-center gap-x-2 gap-y-0.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={includedIds.has(acc.id)}
                            onChange={() => toggleAccount(acc.id)}
                            className={CHECKBOX_CLASS}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{acc.name}</span>
                          {includedIds.has(acc.id) && z !== undefined && (
                            <span className="text-[11px] italic text-gray-500 dark:text-gray-400">
                              Held 1+ yr: {formatCurrency(z.heldOneYear, acc.currency)} → Zakatable: {formatCurrency(z.zakatable, acc.currency)}
                            </span>
                          )}
                        </label>
                        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0">
                          {formatCurrency(acc.calculated_balance ?? 0, acc.currency)}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
          <section className={`${SECTION_CARD} overflow-hidden`}>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 flex-shrink-0">
              <Plus className="w-4 h-4" /> Add more (in {displayCurrency || '—'})
            </h2>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-700 dark:text-gray-300">Gold (value) <input {...numInput(gold, setGold)} /></label>
                <label className="text-sm text-gray-700 dark:text-gray-300">Silver (value) <input {...numInput(silver, setSilver)} /></label>
                <label className="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">Other zakatable assets <input {...numInput(otherAssets, setOtherAssets)} /></label>
                <label className="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 flex items-center gap-2">
                  <Minus className="w-4 h-4 text-red-500 flex-shrink-0" /> Debts to subtract
                  <input {...numInput(debts, setDebts, `flex-1 min-w-0 ${FORM_CONTROL}`)} />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
