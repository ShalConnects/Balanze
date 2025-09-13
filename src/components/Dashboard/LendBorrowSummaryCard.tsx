import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Handshake, AlertTriangle, ArrowRight, Calendar, HelpCircle, X } from 'lucide-react';
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
  const [showBorrowedTooltip, setShowBorrowedTooltip] = useState(false);
  const [showLentMobileModal, setShowLentMobileModal] = useState(false);
  const [showBorrowedMobileModal, setShowBorrowedMobileModal] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState('');
  const { isMobile } = useMobileDetection();

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

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setRecords(data || []);
        setLoading(false);
      });
  }, [user]);
  
  // Don't render for free users
  if (!isPremium) {
    return null;
  }

  // Filter records by currency
  const filteredRecords = records.filter(r => r.currency === filterCurrency);

  const totalLent = filteredRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
  const totalBorrowed = filteredRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
  const outstandingLoans = filteredRecords.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
  const outstandingDebts = filteredRecords.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);

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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lend & Borrow Overview</h2>
        {/* Currency Filter using CustomDropdown */}
        <CustomDropdown
          options={filteredCurrencies.map(currency => ({ value: currency, label: currency }))}
          value={filterCurrency}
          onChange={setFilterCurrency}
          fullWidth={false}
          className="bg-transparent border-0 shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
          style={{ padding: '10px', paddingRight: '5px' }}
          dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 mb-6">
            <div className="w-full relative">
              <StatCard
                title={<div className="flex items-center">Total Lend
                  <div className="relative">
                    <button
                      type="button"
                      className="ml-1 p-1 rounded-full hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
                      aria-label="Show lent info"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </button>
                    {showLentTooltip && !isMobile && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein normal-case">
                        <div className="font-semibold mb-2 normal-case">Total: {formatCurrency(totalActiveLent, filterCurrency)}</div>
                        <div className="font-medium mb-1 normal-case">People Lent To ({Object.keys(lentByPerson).length}):</div>
                        <ul className="space-y-1">
                          {Object.entries(lentByPerson).map(([person, amount]) => (
                            <li key={person} className="flex justify-between">
                              <span className="truncate max-w-[120px] normal-case" title={person}>{person}</span>
                              <span className="ml-2 tabular-nums">{formatCurrency(amount, filterCurrency)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>}
                value={formatCurrency(totalActiveLent, filterCurrency)}
                color="green"
              />
            </div>
            <div className="w-full relative">
              <StatCard
                title={<div className="flex items-center">Total Borrowed
                  <div className="relative">
                    <button
                      type="button"
                      className="ml-1 p-1 rounded-full hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onMouseEnter={() => !isMobile && setShowBorrowedTooltip(true)}
                      onMouseLeave={() => !isMobile && setShowBorrowedTooltip(false)}
                      onFocus={() => !isMobile && setShowBorrowedTooltip(true)}
                      onBlur={() => !isMobile && setShowBorrowedTooltip(false)}
                      onClick={() => {
                        if (isMobile) {
                          setShowBorrowedMobileModal(true);
                        } else {
                          setShowBorrowedTooltip(v => !v);
                        }
                      }}
                      tabIndex={0}
                      aria-label="Show borrowed info"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </button>
                    {showBorrowedTooltip && !isMobile && (
                      <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein normal-case">
                        <div className="font-semibold mb-2 normal-case">Total: {formatCurrency(totalActiveBorrowed, filterCurrency)}</div>
                        <div className="font-medium mb-1 normal-case">People Borrowed From ({Object.keys(borrowedByPerson).length}):</div>
                        <ul className="space-y-1">
                          {Object.entries(borrowedByPerson).map(([person, amount]) => (
                            <li key={person} className="flex justify-between">
                              <span className="truncate max-w-[120px] normal-case" title={person}>{person}</span>
                              <span className="ml-2 tabular-nums">{formatCurrency(amount, filterCurrency)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>}
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
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-64 animate-fadein normal-case">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-700 dark:text-gray-200 normal-case">Total: {formatCurrency(totalActiveLent, filterCurrency)}</div>
              <button
                onClick={() => setShowLentMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="font-medium mb-1 text-gray-700 dark:text-gray-200 normal-case">People Lent To ({Object.keys(lentByPerson).length}):</div>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(lentByPerson).map(([person, amount]) => (
                <li key={person} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                  <span className="truncate max-w-[120px] normal-case" title={person}>{person}</span>
                  <span className="ml-2 tabular-nums">{formatCurrency(amount, filterCurrency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile Modal for Borrowed Info */}
      {showBorrowedMobileModal && isMobile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowBorrowedMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-64 animate-fadein normal-case">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-700 dark:text-gray-200 normal-case">Total: {formatCurrency(totalActiveBorrowed, filterCurrency)}</div>
              <button
                onClick={() => setShowBorrowedMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="font-medium mb-1 text-gray-700 dark:text-gray-200 normal-case">People Borrowed From ({Object.keys(borrowedByPerson).length}):</div>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(borrowedByPerson).map(([person, amount]) => (
                <li key={person} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                  <span className="truncate max-w-[120px] normal-case" title={person}>{person}</span>
                  <span className="ml-2 tabular-nums">{formatCurrency(amount, filterCurrency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 