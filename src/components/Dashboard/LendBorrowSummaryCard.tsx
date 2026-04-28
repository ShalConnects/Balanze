import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';

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
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Widget visibility state - hybrid approach (localStorage + database)
  const [showLendBorrowWidget, setShowLendBorrowWidget] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Listen for localStorage changes to sync with other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showLendBorrowWidget' && e.newValue !== null) {
        setShowLendBorrowWidget(JSON.parse(e.newValue));
      }
    };

    // Listen for storage events (changes from other tabs)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (changes from same tab)
    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showLendBorrowWidget');
      if (saved !== null) {
        setShowLendBorrowWidget(JSON.parse(saved));
      }
    };

    window.addEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);
    };
  }, []);
  
  const cardRef = useRef<HTMLDivElement>(null);

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


  // Load user preferences for L&B widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showLendBorrowWidget', true);
          setShowLendBorrowWidget(showWidget);
          localStorage.setItem('showLendBorrowWidget', JSON.stringify(showWidget));
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

  // Save L&B widget visibility preference (hybrid approach)
  const handleLendBorrowWidgetToggle = async (show: boolean) => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showLendBorrowWidget', JSON.stringify(show));
    setShowLendBorrowWidget(show);
    window.dispatchEvent(new CustomEvent('showLendBorrowWidgetChanged'));
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showLendBorrowWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'L&B widget will be shown' : 'L&B widget hidden'
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
    <div 
      ref={cardRef} 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hide button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => handleLendBorrowWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide L&B widget"
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
      
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pr-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">L&B</h2>
          <DashboardWidgetInfo title="L&B" ariaLabel="Show lend & borrow info">
            {lendBorrowInfoBody}
          </DashboardWidgetInfo>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link 
            to="/lent-borrow" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : (
        <>
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
          {/* Removed Upcoming Due Notification block as it's now handled by the Urgent sidebar */}
        </>
      )}

    </div>
  );
}; 

