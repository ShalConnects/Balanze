import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowRight, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow } from '../../types/index';
import { StatCard } from './StatCard';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';

export const LendBorrowSummaryCard: React.FC = () => {
  const { user, profile } = useAuthStore();
  
  // Check if user has Premium plan for Lend & Borrow
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [records, setRecords] = useState<LendBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLentTooltip, setShowLentTooltip] = useState(false);
  const [showLentMobileModal, setShowLentMobileModal] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState<'center' | 'right'>('center');
  const { isMobile } = useMobileDetection();
  
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

  // Set default currency filter
  useEffect(() => {
    if (!filterCurrency && filteredCurrencies.length > 0) {
      setFilterCurrency(filteredCurrencies[0]);
    }
  }, [filteredCurrencies, filterCurrency]);

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

  // Group by person for tooltips (only active records)
  const lentByPerson = filteredRecords
    .filter(r => r.type === 'lend' && r.status === 'active')
    .reduce((acc, record) => {
      const person = record.person_name || 'Unknown';
      acc[person] = (acc[person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const borrowedByPerson = filteredRecords
    .filter(r => r.type === 'borrow' && r.status === 'active')
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

  return (
    <div ref={cardRef} className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lent & Borrow</h2>
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
                className={`absolute top-full z-50 mt-2 w-80 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein ${
                  tooltipPosition === 'center' 
                    ? 'left-1/2 -translate-x-1/2' 
                    : 'right-0'
                }`}
              >
                <div className="font-semibold mb-3 text-center">Total: {formatCurrency(totalActiveLent + totalActiveBorrowed, filterCurrency)}</div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Left side - Lend list */}
                  <div>
                    <div className="font-medium mb-2 text-green-600 dark:text-green-400">Lent To ({Object.keys(lentByPerson).length})</div>
                    {Object.keys(lentByPerson).length > 0 ? (
                      <ul className="space-y-1">
                        {Object.entries(lentByPerson).map(([person, amount]) => (
                          <li key={person} className="flex justify-between">
                            <span className="truncate max-w-[100px] text-green-600 dark:text-green-400" title={person}>{person}</span>
                            <span className="ml-2 tabular-nums text-green-600 dark:text-green-400">{formatCurrency(amount, filterCurrency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">No active loans</div>
                    )}
                  </div>
                  
                  {/* Right side - Borrow list */}
                  <div>
                    <div className="font-medium mb-2 text-red-600 dark:text-red-400">Borrowed From ({Object.keys(borrowedByPerson).length})</div>
                    {Object.keys(borrowedByPerson).length > 0 ? (
                      <ul className="space-y-1">
                        {Object.entries(borrowedByPerson).map(([person, amount]) => (
                          <li key={person} className="flex justify-between">
                            <span className="truncate max-w-[100px] text-red-600 dark:text-red-400" title={person}>{person}</span>
                            <span className="ml-2 tabular-nums text-red-600 dark:text-red-400">{formatCurrency(amount, filterCurrency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">No active borrows</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency Filter using CustomDropdown */}
          <CustomDropdown
            options={filteredCurrencies.map(currency => ({ value: currency, label: currency }))}
            value={filterCurrency}
            onChange={setFilterCurrency}
            fullWidth={false}
            className="bg-transparent border shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
            style={{ padding: '10px', paddingRight: '5px', border: '1px solid rgb(229 231 235 / var(--tw-bg-opacity, 1))' }}
            dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
          />
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
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 mb-6">
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowLentMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-80 max-w-[90vw] animate-fadein normal-case">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-700 dark:text-gray-200 normal-case text-center flex-1">Total: {formatCurrency(totalActiveLent + totalActiveBorrowed, filterCurrency)}</div>
              <button
                onClick={() => setShowLentMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Top section - Lend list */}
              <div>
                <div className="font-medium mb-2 text-green-600 dark:text-green-400 normal-case">Lent To ({Object.keys(lentByPerson).length})</div>
                {Object.keys(lentByPerson).length > 0 ? (
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(lentByPerson).map(([person, amount]) => (
                      <li key={person} className="flex justify-between text-xs">
                        <span className="truncate max-w-[120px] text-green-600 dark:text-green-400 normal-case" title={person}>{person}</span>
                        <span className="ml-2 tabular-nums text-green-600 dark:text-green-400">{formatCurrency(amount, filterCurrency)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-xs">No active loans</div>
                )}
              </div>
              
              {/* Bottom section - Borrow list */}
              <div>
                <div className="font-medium mb-2 text-red-600 dark:text-red-400 normal-case">Borrowed From ({Object.keys(borrowedByPerson).length})</div>
                {Object.keys(borrowedByPerson).length > 0 ? (
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(borrowedByPerson).map(([person, amount]) => (
                      <li key={person} className="flex justify-between text-xs">
                        <span className="truncate max-w-[120px] text-red-600 dark:text-red-400 normal-case" title={person}>{person}</span>
                        <span className="ml-2 tabular-nums text-red-600 dark:text-red-400">{formatCurrency(amount, filterCurrency)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-xs">No active borrows</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}; 