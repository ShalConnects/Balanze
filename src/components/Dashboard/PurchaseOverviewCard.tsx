import React, { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { DashboardCardShell } from './DashboardCardShell';

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

  const [showPurchasesWidget, setShowPurchasesWidget] = usePersistedToggle(
    'showPurchasesWidget',
    true,
    user?.id,
    { syncFromDb: true }
  );

  // Set loading to false when we have data
  useEffect(() => {
    if (purchases !== undefined) {
      setLoading(false);
    }
  }, [purchases]);

  const hidePurchasesWidget = () => {
    setShowPurchasesWidget(false);
    toast.success('Preference saved!', { description: 'Purchases widget hidden' });
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

  // High-priority planned purchases, surfaced as a header badge
  const highPriorityPlannedCount = useMemo(
    () => filteredPurchases.filter(p => p.priority === 'high' && p.status === 'planned').length,
    [filteredPurchases]
  );

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

  // Don't render if no purchases
  if (purchases.length === 0) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showPurchasesWidget) {
    return null;
  }

  return (
    <DashboardCardShell
      title="Purchases"
      viewAllTo="/purchases"
      onHide={hidePurchasesWidget}
      hideAriaLabel="Hide Purchases widget"
      info={purchasesInfoBody}
      infoAriaLabel="Show purchases info"
      loading={loading}
      badge={
        highPriorityPlannedCount > 0 ? (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {highPriorityPlannedCount} high
          </span>
        ) : undefined
      }
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 mb-0 flex-1">
        <StatCard
          title="Planned"
          value={totalPlannedPurchases.toString()}
          color="yellow"
        />
        <StatCard
          title="Purchased"
          value={totalPurchasedItems.toString()}
          color="red"
        />
      </div>
    </DashboardCardShell>
  );
};
