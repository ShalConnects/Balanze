import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, TrendingUp, ArrowRight, Info, X } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { StatCard } from './StatCard';
import { Link } from 'react-router-dom';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';

interface DonationSavingsOverviewCardProps {
  t: (key: string, options?: any) => string;
  formatCurrency: (amount: number, currency: string) => string;
}

export const DonationSavingsOverviewCard: React.FC<DonationSavingsOverviewCardProps> = ({ 
  t, 
  formatCurrency 
}) => {
  const accounts = useFinanceStore(state => state.accounts);
  const transactions = useFinanceStore(state => state.transactions);
  const donationSavingRecords = useFinanceStore(state => state.donationSavingRecords);
  const { user, profile } = useAuthStore();
  const [filterCurrency, setFilterCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Widget visibility state - hybrid approach (localStorage + database)
  const [showDonationsSavingsWidget, setShowDonationsSavingsWidget] = useState(() => {
    const saved = localStorage.getItem('showDonationsSavingsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  // Load user preferences for Donations & Savings widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showDonationsSavingsWidget', true);
          setShowDonationsSavingsWidget(showWidget);
          localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Handle hover events for cross icon (desktop only)
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Hide tooltip after 3 seconds
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      
      // Clear timeout when mouse leaves
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Save Donations & Savings widget visibility preference (hybrid approach)
  const handleDonationsSavingsWidgetToggle = async (show: boolean) => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(show));
    setShowDonationsSavingsWidget(show);
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showDonationsSavingsWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Donations & Savings widget will be shown' : 'Donations & Savings widget hidden'
        });
      } catch (error) {
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

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

  // Count active savings goals
  const activeSavingsGoals = useMemo(() => {
    return donationSavingRecords.filter(record => 
      record.type === 'saving' && 
      record.status === 'active' &&
      record.currency === filterCurrency
    ).length;
  }, [donationSavingRecords, filterCurrency]);

  // Count completed donations this month
  const monthlyDonations = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      const recordDate = new Date(record.created_at);
      if (recordDate < startOfMonth) return false;
      
      // Check currency
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === filterCurrency;
      }
      
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).length;
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Get DPS accounts contributing to savings for tooltip
  const dpsAccountsForTooltip = useMemo(() => {
    return accounts.filter(a => a.has_dps && a.currency === filterCurrency).map(dpsAccount => {
      const savingsAccount = dpsAccount.dps_savings_account_id 
        ? accounts.find(a => a.id === dpsAccount.dps_savings_account_id)
        : null;
      return {
        name: dpsAccount.name,
        savingsBalance: savingsAccount ? (savingsAccount.calculated_balance || 0) : 0
      };
    });
  }, [accounts, filterCurrency]);

  // Get recent donations for tooltip
  const recentDonations = useMemo(() => {
    return donationSavingRecords
      .filter(record => {
        if (record.status !== 'donated') return false;
        
        // Check currency
        if (!record.transaction_id) {
          const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
          const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
          return manualCurrency === filterCurrency;
        }
        
        const transaction = transactions.find(t => t.id === record.transaction_id);
        const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
        return account && account.currency === filterCurrency;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3); // Show last 3 donations
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

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

  // Don't render the card if there are no donation/savings records and no DPS accounts
  const hasDpsAccounts = accounts.some(a => a.has_dps && a.currency === filterCurrency);
  const hasDonationRecords = donationSavingRecords.some(record => {
    if (!record.transaction_id) {
      const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
      const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
      return manualCurrency === filterCurrency;
    }
    const transaction = transactions.find(t => t.id === record.transaction_id);
    const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
    return account && account.currency === filterCurrency;
  });

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-4 lg:p-5 shadow-sm border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between mb-3">
          {/* <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

  // Don't render if no data
  if (!hasDpsAccounts && !hasDonationRecords) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showDonationsSavingsWidget) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hide button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => handleDonationsSavingsWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide Donations & Savings widget"
        >
          <X className="w-4 h-4" />
          {/* Tooltip - only on desktop */}
          {showCrossTooltip && !isMobile && (
            <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
              Click to hide this widget
              <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          )}
        </button>
      )}
      
      {/* Header - Responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pr-8 gap-3">
        {/* Left side - Info button */}
        <div className="flex items-center gap-2 flex-1">
          {/* <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2> */}
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1 rounded-full hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              onFocus={() => !isMobile && setShowTooltip(true)}
              onBlur={() => !isMobile && setShowTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowMobileModal(true);
                } else {
                  setShowTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show donations & savings info"
            >
              <Info className="w-4 h-4 text-gray-400" />
            </button>
            {showTooltip && !isMobile && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                
                {dpsAccountsForTooltip.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold mb-1">DPS Accounts ({dpsAccountsForTooltip.length}):</div>
                    <ul className="space-y-1">
                      {dpsAccountsForTooltip.map((account, index) => (
                        <li key={index} className="flex justify-between">
                          <span className="truncate max-w-[120px]" title={account.name}>{account.name}</span>
                          <span className="ml-2 tabular-nums">{formatCurrency(account.savingsBalance, filterCurrency || 'USD')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {recentDonations.length > 0 && (
                  <div>
                    <div className="font-semibold mb-1">Recent Donations:</div>
                    <ul className="space-y-1">
                      {recentDonations.map((donation, index) => {
                        // Clean up donation note by removing currency information
                        const cleanNote = donation.note?.replace(/\s*\(?Currency:\s*[A-Z]{3}\)?/g, '').trim() || 'Donation';
                        return (
                          <li key={index} className="flex justify-between">
                            <span className="truncate max-w-[120px]" title={cleanNote}>{cleanNote}</span>
                            <span className="ml-2 tabular-nums">{formatCurrency(donation.amount || 0, filterCurrency || 'USD')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Filter using CustomDropdown */}
          <CustomDropdown
            options={currencyOptions}
            value={filterCurrency}
            onChange={setFilterCurrency}
            fullWidth={false}
            className="bg-transparent border shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
            style={{ padding: '10px', paddingRight: '5px', border: '1px solid rgb(229 231 235 / var(--tw-bg-opacity, 1))' }}
            dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
          />
          <Link 
            to="/donations" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="w-full">
          <StatCard
            title="Total Donated"
            value={formatCurrency(totalDonated, filterCurrency || 'USD')}
            color="green"
            insight={
              <span className="text-xs text-gray-500">
                {monthlyDonations > 0 ? `${monthlyDonations} donations this month` : 'No donations this month'}
              </span>
            }
          />
        </div>
        <div className="w-full">
          <StatCard
            title="Total Saved"
            value={formatCurrency(totalSaved, filterCurrency || 'USD')}
            color="green"
            insight={
              <span className="text-xs text-gray-500">
                {activeSavingsGoals > 0 
                  ? `${activeSavingsGoals} active goals` 
                  : dpsAccountsForTooltip.length > 0 
                    ? `${dpsAccountsForTooltip.length} DPS accounts` 
                    : 'No active savings goals'
                }
              </span>
            }
          />
        </div>
      </div>

      {/* Mobile Modal for Donations & Savings Info */}
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-80 max-w-[90vw] animate-fadein">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {dpsAccountsForTooltip.length > 0 && (
              <div className="mb-3">
                <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">DPS Accounts ({dpsAccountsForTooltip.length}):</div>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {dpsAccountsForTooltip.map((account, index) => (
                    <li key={index} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                      <span className="truncate max-w-[120px]" title={account.name}>{account.name}</span>
                      <span className="ml-2 tabular-nums">{formatCurrency(account.savingsBalance, filterCurrency || 'USD')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {recentDonations.length > 0 && (
              <div>
                <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">Recent Donations:</div>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {recentDonations.map((donation, index) => {
                    // Clean up donation note by removing currency information
                    const cleanNote = donation.note?.replace(/\s*\(?Currency:\s*[A-Z]{3}\)?/g, '').trim() || 'Donation';
                    return (
                      <li key={index} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                        <span className="truncate max-w-[120px]" title={cleanNote}>{cleanNote}</span>
                        <span className="ml-2 tabular-nums">{formatCurrency(donation.amount || 0, filterCurrency || 'USD')}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
