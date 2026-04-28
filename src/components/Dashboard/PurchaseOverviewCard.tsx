import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';

interface PurchaseOverviewCardProps {
  filterCurrency?: string;
  timeFilter?: '1m' | '3m' | '6m' | '1y' | 'all';
}

export const PurchaseOverviewCard: React.FC<PurchaseOverviewCardProps> = ({ 
  filterCurrency = '',
  timeFilter = 'all'
}) => {
  const { user } = useAuthStore();
  const purchases = useFinanceStore((state) => state.purchases);
  
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Widget visibility state - hybrid approach (localStorage + database)
  const [showPurchasesWidget, setShowPurchasesWidget] = useState(() => {
    const saved = localStorage.getItem('showPurchasesWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for localStorage changes to sync with other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showPurchasesWidget' && e.newValue !== null) {
        setShowPurchasesWidget(JSON.parse(e.newValue));
      }
    };

    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showPurchasesWidget');
      if (saved !== null) {
        setShowPurchasesWidget(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
    };
  }, []);

  // Load user preferences for Purchases widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showPurchasesWidget', true);
          setShowPurchasesWidget(showWidget);
          localStorage.setItem('showPurchasesWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Set loading to false when we have data
  useEffect(() => {
    if (purchases !== undefined) {
      setLoading(false);
    }
  }, [purchases]);

  // Handle hover events for cross icon (desktop only)
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      
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

  // Save Purchases widget visibility preference (hybrid approach)
  const handlePurchasesWidgetToggle = async (show: boolean) => {
    localStorage.setItem('showPurchasesWidget', JSON.stringify(show));
    setShowPurchasesWidget(show);
    window.dispatchEvent(new CustomEvent('showPurchasesWidgetChanged'));
    
    if (user?.id) {
      try {
        await setPreference(user.id, 'showPurchasesWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Purchases widget will be shown' : 'Purchases widget hidden'
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

  // Date range logic based on time filter - memoized for performance
  const { startDate, endDate } = useMemo(() => {
    if (timeFilter === 'all') {
      return { startDate: null, endDate: null };
    }
    
    const now = new Date();
    let start: Date;
    let end: Date;
    
    if (timeFilter === '1m') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '3m') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '6m') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else { // '1y'
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    return { startDate: start, endDate: end };
  }, [timeFilter]);

  // Filter purchases by currency and date range
  const filteredPurchases = useMemo(() => {
    let filtered = purchases;
    
    // Filter by currency
    if (filterCurrency) {
      filtered = filtered.filter(p => (p.currency || 'USD') === filterCurrency);
    }
    
    // Filter by date range (normalize dates for comparison)
    if (timeFilter !== 'all' && startDate && endDate) {
      filtered = filtered.filter(p => {
        if (!p.purchase_date) return false;
        const purchaseDate = new Date(p.purchase_date);
        // Normalize dates to midnight for comparison
        const normalizedDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
        const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
      });
    }
    
    return filtered;
  }, [purchases, filterCurrency, timeFilter, startDate, endDate]);

  // Calculate purchase overview stats - memoized for performance
  const purchaseStats = useMemo(() => {
    const planned = filteredPurchases.filter(p => p.status === 'planned');
    const purchased = filteredPurchases.filter(p => p.status === 'purchased');
    const cancelled = filteredPurchases.filter(p => p.status === 'cancelled');
    
    const totalPlannedPurchases = planned.length;
    const totalPurchasedItems = purchased.length;
    const totalCancelledItems = cancelled.length;
    const totalPlannedValue = planned.reduce((sum, p) => sum + p.price, 0);
    const totalPurchasedValue = purchased.reduce((sum, p) => sum + p.price, 0);
    
    const recentPurchases = purchased
      .filter(p => p.purchase_date)
      .sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
    
    const recentPlannedPurchases = planned
      .filter(p => p.purchase_date)
      .sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
    
    return {
      totalPlannedPurchases,
      totalPurchasedItems,
      totalCancelledItems,
      totalPlannedValue,
      totalPurchasedValue,
      recentPurchases,
      recentPlannedPurchases
    };
  }, [filteredPurchases]);
  
  const {
    totalPlannedPurchases,
    totalPurchasedItems,
    totalPlannedValue,
    totalPurchasedValue,
    recentPurchases
  } = purchaseStats;

  const purchasesInfoBody = useMemo(() => {
    const cur = filterCurrency || 'USD';
    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              Planned ({totalPlannedPurchases}):
            </div>
            {totalPlannedPurchases > 0 ? (
              <div className="break-words bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
                {formatCurrency(totalPlannedValue, cur)}
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No planned purchases</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              Purchased ({totalPurchasedItems}):
            </div>
            {totalPurchasedItems > 0 ? (
              <div className="break-words bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
                {formatCurrency(totalPurchasedValue, cur)}
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No purchases yet</div>
            )}
          </div>
        </div>
        {recentPurchases.length > 0 && (
          <>
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
            <div>
              <div className="mb-1">
                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Recent Purchases</div>
              </div>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                {recentPurchases.map((purchase, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]"
                      title={purchase.name || 'Purchase'}
                    >
                      {purchase.name || 'Purchase'}
                    </span>
                    <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                      {formatCurrency(purchase.price || 0, purchase.currency || cur)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }, [
    totalPlannedPurchases,
    totalPurchasedItems,
    totalPlannedValue,
    totalPurchasedValue,
    recentPurchases,
    filterCurrency,
  ]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
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

  // Don't render if no purchases
  if (purchases.length === 0) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showPurchasesWidget) {
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
          onClick={() => handlePurchasesWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide Purchases widget"
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Purchases</h2>
          <DashboardWidgetInfo title="Purchases" ariaLabel="Show purchases info">
            {purchasesInfoBody}
          </DashboardWidgetInfo>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link 
            to="/purchases" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {/* Purchase Stats Cards - Responsive grid */}
      <div className="dashboard-stat-grid gap-3 sm:gap-4 mb-0 flex-1">
        <StatCard
          title="Planned"
          value={totalPlannedPurchases.toString()}
          color="yellow"
        />
        <StatCard
          title="Purchased"
          value={totalPurchasedItems.toString()}
          trend="up"
          color="red"
        />
      </div>

    </div>
  );
};
