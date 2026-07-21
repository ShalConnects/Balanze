import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { toast } from 'sonner';
import { DashboardCardShell } from './DashboardCardShell';

interface LendBorrowSummaryCardProps {
  filterCurrency?: string;
}

export const LendBorrowSummaryCard: React.FC<LendBorrowSummaryCardProps> = ({ 
  filterCurrency = '' 
}) => {
  const { user, profile } = useAuthStore();
  
  // Check if user has Premium plan for L&B
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [records, setRecords] = useState<LendBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLendBorrowWidget, setShowLendBorrowWidget] = usePersistedToggle(
    'showLendBorrowWidget',
    true,
    user?.id,
    { syncFromDb: true }
  );

  // Get all unique currencies from records
  const recordCurrencies = useMemo(() => {
    return Array.from(new Set(records.map(r => r.currency)));
  }, [records]);

  // Filter currencies based on profile.selected_currencies
  const filteredCurrencies = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      // Only show currencies that are both in selected_currencies and present in records
      return recordCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return recordCurrencies;
  }, [profile?.selected_currencies, recordCurrencies]);

  const hideLendBorrowWidget = () => {
    setShowLendBorrowWidget(false);
    toast.success('Preference saved!', { description: 'L&B widget hidden' });
  };

  useEffect(() => {
    if (!user || !isPremium) return;
    setLoading(true);
    supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setRecords(data || []);
        setLoading(false);
      });
  }, [user, isPremium]);

  // Don't render for free users - MOVED TO END AFTER ALL HOOKS
  if (!isPremium) {
    return null;
  }

  // Filter records by currency
  const filteredRecords = records.filter(r => r.currency === filterCurrency);

  // Group by person for tooltips (active and overdue records)
  const lentByPerson = filteredRecords
    .filter(r => r.type === 'lend' && (r.status === 'active' || r.status === 'overdue'))
    .reduce((acc, record) => {
      const person = record.person_name || 'Unknown';
      acc[person] = (acc[person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const borrowedByPerson = filteredRecords
    .filter(r => r.type === 'borrow' && (r.status === 'active' || r.status === 'overdue'))
    .reduce((acc, record) => {
      const person = record.person_name || 'Unknown';
      acc[person] = (acc[person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalActiveLent = Object.values(lentByPerson).reduce((sum, amt) => sum + amt, 0);
  const totalActiveBorrowed = Object.values(borrowedByPerson).reduce((sum, amt) => sum + amt, 0);
  const overdueCount = filteredRecords.filter(r => r.status === 'overdue').length;

  const lendBorrowInfoBody = (
    <div className="space-y-2 sm:space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
            Lent To ({Object.keys(lentByPerson).length})
          </div>
          {Object.keys(lentByPerson).length > 0 ? (
            <div className="break-words bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {formatCurrency(totalActiveLent, filterCurrency)}
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No active loans</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
            Borrowed From ({Object.keys(borrowedByPerson).length}):
          </div>
          {Object.keys(borrowedByPerson).length > 0 ? (
            <div className="break-words bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {formatCurrency(totalActiveBorrowed, filterCurrency)}
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No active borrows</div>
          )}
        </div>
      </div>
      {(Object.keys(lentByPerson).length > 0 || Object.keys(borrowedByPerson).length > 0) && (
        <>
          <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {Object.keys(lentByPerson).length > 0 && (
              <div>
                <div className="mb-1">
                  <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Lent To</div>
                </div>
                <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                  {Object.entries(lentByPerson).map(([person, amount]) => (
                    <li
                      key={person}
                      className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]" title={person}>
                        {person}
                      </span>
                      <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                        {formatCurrency(amount, filterCurrency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Object.keys(borrowedByPerson).length > 0 && (
              <div>
                <div className="mb-1">
                  <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Borrowed From</div>
                </div>
                <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                  {Object.entries(borrowedByPerson).map(([person, amount]) => (
                    <li
                      key={person}
                      className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]" title={person}>
                        {person}
                      </span>
                      <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                        {formatCurrency(amount, filterCurrency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Don't render the card if there are no records
  if (records.length === 0) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showLendBorrowWidget) {
    return null;
  }

  return (
    <DashboardCardShell
      title="L&B"
      viewAllTo="/lent-borrow"
      onHide={hideLendBorrowWidget}
      hideAriaLabel="Hide L&B widget"
      info={lendBorrowInfoBody}
      infoAriaLabel="Show lend & borrow info"
      loading={loading}
      badge={
        overdueCount > 0 ? (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {overdueCount} overdue
          </span>
        ) : undefined
      }
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 mb-0 flex-1">
        <div className="w-full relative">
          <StatCard
            title="Total Lent"
            value={formatCurrency(totalActiveLent, filterCurrency)}
            color="green"
          />
        </div>
        <div className="w-full relative">
          <StatCard
            title="Total Borrowed"
            value={formatCurrency(totalActiveBorrowed, filterCurrency)}
            color="red"
          />
        </div>
      </div>
    </DashboardCardShell>
  );
};

