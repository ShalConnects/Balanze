import React, { useState, useEffect, useMemo } from 'react';
import { Heart, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';

export const DonationSavingsCard: React.FC<{ t: any; formatCurrency: any }> = ({ t, formatCurrency }) => {
  const accounts = useFinanceStore(state => state.accounts);
  const transactions = useFinanceStore(state => state.transactions);
  const donationSavingRecords = useFinanceStore(state => state.donationSavingRecords);
  const { profile } = useAuthStore();
  const [filterCurrency, setFilterCurrency] = useState('');
  const [loading, setLoading] = useState(true);

  // Get all unique currencies from accounts
  const recordCurrencies = useMemo(() => {
    return Array.from(new Set(accounts.map(a => a.currency)));
  }, [accounts]);

  // Set default currency filter
  useEffect(() => {
    if (!filterCurrency) {
      // First try to use profile's local currency
      if (profile?.local_currency) {
        setFilterCurrency(profile.local_currency);
      }
      // Then try profile's selected currencies
      else if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
        setFilterCurrency(profile.selected_currencies[0]);
      }
      // Then try available account currencies
      else if (recordCurrencies.length > 0) {
      setFilterCurrency(recordCurrencies[0]);
      }
      // Fallback to USD if no currencies available
      else {
      setFilterCurrency('USD');
      }
    }
  }, [recordCurrencies, filterCurrency, profile]);

  // Set loading to false when we have data
  useEffect(() => {
    if (donationSavingRecords !== undefined) {
      setLoading(false);
    }
  }, [donationSavingRecords]);

  // Calculate totalDonated using the same logic as Donations page
  const totalDonated = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      // For manual donations (no transaction_id), check currency from note
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === filterCurrency;
      }
      
      // For regular donations, check currency from linked transaction
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Calculate totalSaved by checking all DPS accounts and their linked savings accounts
  const totalSaved = useMemo(() => {
    let total = 0;
    
    // Get all DPS accounts for the selected currency
    const dpsAccounts = accounts.filter(a => a.has_dps && a.currency === filterCurrency);
    
    dpsAccounts.forEach(dpsAccount => {
      // If the DPS account has a linked savings account, add its balance
      if (dpsAccount.dps_savings_account_id) {
        const savingsAccount = accounts.find(a => a.id === dpsAccount.dps_savings_account_id);
        if (savingsAccount) {
          total += savingsAccount.calculated_balance || 0;
        }
      }
    });
    
    return total;
  }, [accounts, filterCurrency]);

  // Only show the card if there are actual saved or donated amounts
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the card even if there's no data, but with zero values
  // This helps users understand the feature exists

  // Currency options: only show selected_currencies if available, else all
  const allCurrencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'BDT', label: 'BDT' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ];
  const currencyOptions = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? allCurrencyOptions.filter(opt => profile.selected_currencies?.includes?.(opt.value))
    : allCurrencyOptions;

  // Card style matches CurrencyOverviewCard
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2>
        {/* Currency Filter using CustomDropdown */}
        <CustomDropdown
          options={currencyOptions}
          value={filterCurrency}
          onChange={setFilterCurrency}
          fullWidth={false}
          className="bg-transparent border-0 shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
          style={{ padding: '10px', paddingRight: '5px' }}
          dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
        />
      </div>
      <div className="space-y-3">
        {/* Total Donated */}
        <div className="w-full bg-green-50 dark:bg-green-900/10 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <Heart className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">Total Donated</p>
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalDonated, filterCurrency || 'USD')}
              </p>
            </div>
          </div>
        </div>
        {/* Total Saved */}
        <div className="w-full bg-red-50 dark:bg-red-900/40 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">Total Saved</p>
              </div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalSaved, filterCurrency || 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 

