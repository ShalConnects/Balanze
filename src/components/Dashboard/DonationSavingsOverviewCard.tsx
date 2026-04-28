import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, TrendingUp, ArrowRight, X, Clock, Calendar } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { Link } from 'react-router-dom';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';

interface DonationSavingsOverviewCardProps {
  t: (key: string, options?: any) => string;
  formatCurrency: (amount: number, currency: string) => string;
  filterCurrency?: string;
  timeFilter?: '1m' | '3m' | '6m' | '1y' | 'all';
}

export const DonationSavingsOverviewCard: React.FC<DonationSavingsOverviewCardProps> = ({ 
  t, 
  formatCurrency,
  filterCurrency = '',
  timeFilter = 'all'
}) => {
  const accounts = useFinanceStore(state => state.accounts);
  const transactions = useFinanceStore(state => state.transactions);
  const donationSavingRecords = useFinanceStore(state => state.donationSavingRecords);
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
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

  // Date range logic based on time filter - memoized for performance
  const { startDate, endDate } = useMemo(() => {
    if (timeFilter === 'all') {
      return { startDate: null, endDate: null };
    }
    
    const now = new Date();
    let start: Date;
    let end: Date;
    
    if (timeFilter === '1m') {
      // Current month: from 1st of current month to last day of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '3m') {
      // Last 3 months: from 3 months ago to end of current month
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '6m') {
      // Last 6 months: from 6 months ago to end of current month
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else { // '1y'
      // Last 12 months: from 12 months ago to end of current month
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    return { startDate: start, endDate: end };
  }, [timeFilter]);

  // Set loading to false when we have data
  useEffect(() => {
    if (donationSavingRecords !== undefined) {
      setLoading(false);
    }
  }, [donationSavingRecords]);

  // Additional effect to handle initial data loading state
  useEffect(() => {
    // If we have user but no donationSavingRecords data yet, keep loading
    if (user && donationSavingRecords === undefined) {
      setLoading(true);
    }
  }, [user, donationSavingRecords]);

  // Load user preferences for Donations widget visibility
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
      
      // Hide tooltip after 1 second
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 1000);
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

  // Save Donations widget visibility preference (hybrid approach)
  const handleDonationsSavingsWidgetToggle = async (show: boolean) => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(show));
    setShowDonationsSavingsWidget(show);
    window.dispatchEvent(new CustomEvent('showDonationsSavingsWidgetChanged'));
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showDonationsSavingsWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Donations widget will be shown' : 'Donations widget hidden'
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

  // Helper function to check if date is within range (normalize to date only for comparison)
  const isDateInRange = (dateString: string | null | undefined): boolean => {
    if (timeFilter === 'all' || !startDate || !endDate || !dateString) return true;
    const date = new Date(dateString);
    // Normalize dates to midnight for comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  // Calculate totalDonated using the same logic as Donations page
  const totalDonated = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      // Check date range
      if (!isDateInRange(record.created_at || record.updated_at)) return false;
      
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
  }, [donationSavingRecords, accounts, transactions, filterCurrency, timeFilter, startDate, endDate]);

  // Calculate totalPending for pending donations
  const totalPending = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'pending' || record.type !== 'donation') return false;
      
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

  // Count pending donations
  const pendingDonationsCount = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'pending' || record.type !== 'donation') return false;
      
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
    }).length;
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

  // Count active savings goals (pending savings records)
  const activeSavingsGoals = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.type !== 'saving' || record.status !== 'pending') return false;
      
      // Check currency from linked transaction or note
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === filterCurrency;
      }
      
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).length;
  }, [donationSavingRecords, filterCurrency, accounts, transactions]);

  // Count donations in selected period
  const monthlyDonations = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      // Check date range
      if (!isDateInRange(record.created_at || record.updated_at)) return false;
      
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
  }, [donationSavingRecords, accounts, transactions, filterCurrency, timeFilter, startDate, endDate]);

  // Calculate total donated amount in selected period
  const totalMonthlyDonated = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      // Check date range
      if (!isDateInRange(record.created_at || record.updated_at)) return false;
      
      // Check currency
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === filterCurrency;
      }
      
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [donationSavingRecords, accounts, transactions, filterCurrency, timeFilter, startDate, endDate]);

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

  // Get recent donations for tooltip (filtered by time range)
  const recentDonations = useMemo(() => {
    return donationSavingRecords
      .filter(record => {
        if (record.status !== 'donated') return false;
        
        // Check date range
        if (!isDateInRange(record.created_at || record.updated_at)) return false;
        
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
  }, [donationSavingRecords, accounts, transactions, filterCurrency, timeFilter, startDate, endDate]);

  const donationsInfoBody = useMemo(() => {
    const periodLabel =
      timeFilter === 'all'
        ? 'All Time'
        : timeFilter === '1m'
          ? 'This Month'
          : timeFilter === '3m'
            ? '3 Months'
            : timeFilter === '6m'
              ? '6 Months'
              : '1 Year';
    const cur = filterCurrency || 'USD';
    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              Pending ({pendingDonationsCount}):
            </div>
            {pendingDonationsCount > 0 ? (
              <div className="break-words bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
                {formatCurrency(totalPending, cur)}
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No pending donations</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              {periodLabel} ({monthlyDonations}):
            </div>
            {monthlyDonations > 0 ? (
              <div className="break-words bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
                {formatCurrency(totalMonthlyDonated, cur)}
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No donations this month</div>
            )}
          </div>
        </div>
        {recentDonations.length > 0 && (
          <>
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
            <div>
              <div className="mb-1">
                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Recent Donations</div>
              </div>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                {recentDonations.map((donation, index) => {
                  const cleanNote = donation.note?.replace(/\s*\(?Currency:\s*[A-Z]{3}\)?/g, '').trim() || 'Donation';
                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]" title={cleanNote}>
                        {cleanNote}
                      </span>
                      <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                        {formatCurrency(donation.amount || 0, cur)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }, [
    pendingDonationsCount,
    totalPending,
    monthlyDonations,
    totalMonthlyDonated,
    recentDonations,
    filterCurrency,
    timeFilter,
    formatCurrency,
  ]);

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
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          {/* <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
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
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hide button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => handleDonationsSavingsWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide Donations widget"
        >
          <X className="w-4 h-4" />
          {/* Tooltip - only on desktop */}
          {showCrossTooltip && !isMobile && (
            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
              Click to hide this widget
              <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          )}
        </button>
      )}
      
      {/* Header - Responsive layout */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pr-8">
        {/* Left side - Info button */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations</h2>
          <DashboardWidgetInfo title="Donations" ariaLabel="Show donations & savings info">
            {donationsInfoBody}
          </DashboardWidgetInfo>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link 
            to="/donations" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
        <div className="w-full">
          <StatCard
            title="Total Pending"
            value={formatCurrency(totalPending, filterCurrency || 'USD')}
            color="orange"
          />
        </div>
        <div className="w-full">
          <StatCard
            title="Total Donated"
            value={formatCurrency(totalDonated, filterCurrency || 'USD')}
            color="green"
          />
        </div>
      </div>

    </div>
  );
};
