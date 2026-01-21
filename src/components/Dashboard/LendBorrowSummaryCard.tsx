import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowRight, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';

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
  const [showLentTooltip, setShowLentTooltip] = useState(false);
  const [showLentMobileModal, setShowLentMobileModal] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'center' | 'right'>('center');
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
  
  // Refs for responsive positioning
  const tooltipRef = useRef<HTMLDivElement>(null);
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

  // Function to calculate tooltip position
  const calculateTooltipPosition = () => {
    if (!tooltipRef.current || !cardRef.current) return;
    
    const tooltip = tooltipRef.current;
    const card = cardRef.current;
    
    // Get positions
    const cardRect = card.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Calculate if tooltip would overflow to the right
    const tooltipRight = cardRect.left + (cardRect.width / 2) + (tooltipRect.width / 2);
    const cardRight = cardRect.right;
    
    // If tooltip would overflow, position it to the right
    if (tooltipRight > cardRight) {
      setTooltipPosition('right');
    } else {
      setTooltipPosition('center');
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

  // Update tooltip position when tooltip is shown
  useEffect(() => {
    if (showLentTooltip) {
      // Small delay to ensure tooltip is rendered
      setTimeout(calculateTooltipPosition, 10);
    }
  }, [showLentTooltip]);
  
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
      
      <div className="flex items-center justify-between mb-2 pr-8">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">L&B</h2>
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
              onMouseEnter={() => !isMobile && setShowLentTooltip(true)}
              onMouseLeave={() => !isMobile && setShowLentTooltip(false)}
              onFocus={() => !isMobile && setShowLentTooltip(true)}
              onBlur={() => !isMobile && setShowLentTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowLentMobileModal(true);
                } else {
                  setShowLentTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show lend & borrow info"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
            </button>
            {showLentTooltip && !isMobile && (
              <div 
                ref={tooltipRef}
                className="absolute left-1/2 top-full z-50 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 text-xs text-gray-700 dark:text-gray-200 animate-fadein"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Left side - Lend list */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Lent To ({Object.keys(lentByPerson).length})</div>
                      {Object.keys(lentByPerson).length > 0 ? (
                        <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                          {formatCurrency(totalActiveLent, filterCurrency)}
                        </div>
                      ) : (
                        <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500">No active loans</div>
                      )}
                    </div>

                    {/* Right side - Borrow list */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Borrowed From ({Object.keys(borrowedByPerson).length}):</div>
                      {Object.keys(borrowedByPerson).length > 0 ? (
                        <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent break-words">
                          {formatCurrency(totalActiveBorrowed, filterCurrency)}
                        </div>
                      ) : (
                        <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500">No active borrows</div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Lists */}
                  {(Object.keys(lentByPerson).length > 0 || Object.keys(borrowedByPerson).length > 0) && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {/* Left side - Lend list */}
                        {Object.keys(lentByPerson).length > 0 && (
                          <div>
                            <div className="mb-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-[10px] sm:text-[11px]">Lent To</div>
                            </div>
                            <ul className="space-y-0.5 max-h-32 sm:max-h-40 overflow-y-auto">
                              {Object.entries(lentByPerson).map(([person, amount]) => (
                                <li key={person} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                                  <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={person}>{person}</span>
                                  <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 flex-shrink-0">
                                    {formatCurrency(amount, filterCurrency)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Right side - Borrow list */}
                        {Object.keys(borrowedByPerson).length > 0 && (
                          <div>
                            <div className="mb-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-[10px] sm:text-[11px]">Borrowed From</div>
                            </div>
                            <ul className="space-y-0.5 max-h-32 sm:max-h-40 overflow-y-auto">
                              {Object.entries(borrowedByPerson).map(([person, amount]) => (
                                <li key={person} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                                  <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={person}>{person}</span>
                                  <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 flex-shrink-0">
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
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/lent-borrow" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
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
          <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-0 flex-1">
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

      {/* Mobile Modal for Lent Info */}
      {showLentMobileModal && isMobile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowLentMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 sm:p-4 w-[90vw] sm:w-80 md:w-96 max-w-md animate-fadein normal-case">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 normal-case">L&B Info</div>
              <button
                onClick={() => setShowLentMobileModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2 touch-manipulation"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Top section - Lend list */}
              <div>
                <div className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent normal-case">Lent To ({Object.keys(lentByPerson).length})</div>
                {Object.keys(lentByPerson).length > 0 ? (
                  <>
                    <ul className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                      {Object.entries(lentByPerson).map(([person, amount]) => (
                        <li key={person} className="flex justify-between text-[10px] sm:text-xs">
                          <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-[140px] bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent normal-case min-w-0" title={person}>{person}</span>
                          <span className="ml-2 tabular-nums bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex-shrink-0">{formatCurrency(amount, filterCurrency)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Total</span>
                        <span className="ml-2 tabular-nums font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex-shrink-0">{formatCurrency(totalActiveLent, filterCurrency)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">No active loans</div>
                )}
              </div>
              
              {/* Bottom section - Borrow list */}
              <div>
                <div className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent normal-case">Borrowed From ({Object.keys(borrowedByPerson).length})</div>
                {Object.keys(borrowedByPerson).length > 0 ? (
                  <>
                    <ul className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                      {Object.entries(borrowedByPerson).map(([person, amount]) => (
                        <li key={person} className="flex justify-between text-[10px] sm:text-xs">
                          <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-[140px] bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent normal-case min-w-0" title={person}>{person}</span>
                          <span className="ml-2 tabular-nums bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex-shrink-0">{formatCurrency(amount, filterCurrency)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Total</span>
                        <span className="ml-2 tabular-nums font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex-shrink-0">{formatCurrency(totalActiveBorrowed, filterCurrency)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">No active borrows</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}; 

