import React, { useRef, useEffect } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Transaction, Account, Category } from '../../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TransactionFiltersProps {
  filters: {
    search: string;
    type: string;
    category: string;
    account: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  onFiltersChange: (filters: any) => void;
  accounts: Account[];
  categories: Category[];
  globalSearchTerm: string;
  onGlobalSearchChange: (term: string) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  accounts,
  categories,
  globalSearchTerm,
  onGlobalSearchChange
}) => {
  const [showTypeMenu, setShowTypeMenu] = React.useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  const [showAccountMenu, setShowAccountMenu] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      category: 'all',
      account: 'all',
      dateRange: { start: '', end: '' }
    });
    onGlobalSearchChange('');
  };

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.category !== 'all' || 
    filters.account !== 'all' || filters.dateRange.start || filters.dateRange.end || globalSearchTerm;

  const getDateRangeLabel = () => {
    if (!filters.dateRange.start || !filters.dateRange.end) {
      return 'All Time';
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if it's today
    if (filters.dateRange.start === todayStr && filters.dateRange.end === todayStr) {
      return 'Today';
    }

    // Check if it's this week
    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === mondayStr && filters.dateRange.end === sundayStr) {
      return 'This Week';
    }

    // Check if it's this month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    const lastOfMonthStr = lastOfMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfMonthStr && filters.dateRange.end === lastOfMonthStr) {
      return 'This Month';
    }

    // Check if it's last month
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const firstOfLastMonthStr = firstOfLastMonth.toISOString().slice(0, 10);
    const lastOfLastMonthStr = lastOfLastMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfLastMonthStr && filters.dateRange.end === lastOfLastMonthStr) {
      return 'Last Month';
    }

    // Custom range
    return `${filters.dateRange.start} to ${filters.dateRange.end}`;
  };

  const handlePresetRange = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = end = today.toISOString().slice(0, 10);
        break;
      case 'week':
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = monday.toISOString().slice(0, 10);
        end = sunday.toISOString().slice(0, 10);
        break;
      case 'month':
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      case 'lastMonth':
        const firstLast = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastLast = new Date(today.getFullYear(), today.getMonth(), 0);
        start = firstLast.toISOString().slice(0, 10);
        end = lastLast.toISOString().slice(0, 10);
        break;
      case 'year':
        const firstYear = new Date(today.getFullYear(), 0, 1);
        const lastYear = new Date(today.getFullYear(), 11, 31);
        start = firstYear.toISOString().slice(0, 10);
        end = lastYear.toISOString().slice(0, 10);
        break;
      case 'allTime':
        start = '';
        end = '';
        break;
    }

    updateFilter('dateRange', { start, end });
    setShowDatePicker(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm" style={{ paddingBottom: '13px' }}>
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 flex-1">
            {/* Global Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchTerm}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Search transactions..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="relative" ref={typeMenuRef}>
              <button
                onClick={() => setShowTypeMenu(v => !v)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                  filters.type !== 'all' 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{filters.type === 'all' ? 'All Types' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}</span>
              </button>
              {showTypeMenu && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={() => { updateFilter('type', 'all'); setShowTypeMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => { updateFilter('type', 'income'); setShowTypeMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'income' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => { updateFilter('type', 'expense'); setShowTypeMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'expense' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    Expense
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setShowCategoryMenu(v => !v)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                  filters.category !== 'all' 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{filters.category === 'all' ? 'All Categories' : filters.category}</span>
              </button>
              {showCategoryMenu && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px]">
                  <button
                    onClick={() => { updateFilter('category', 'all'); setShowCategoryMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => { updateFilter('category', category.name); setShowCategoryMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === category.name ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Filter */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setShowAccountMenu(v => !v)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                  filters.account !== 'all' 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>
                  {filters.account === 'all' 
                    ? 'All Accounts' 
                    : accounts.find(a => a.id === filters.account)?.name || 'Unknown Account'
                  }
                </span>
              </button>
              {showAccountMenu && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px]">
                  <button
                    onClick={() => { updateFilter('account', 'all'); setShowAccountMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    All Accounts
                  </button>
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => { updateFilter('account', account.id); setShowAccountMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === account.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(v => !v)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                  filters.dateRange.start || filters.dateRange.end
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{getDateRangeLabel()}</span>
              </button>
              {showDatePicker && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Quick Presets</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePresetRange('today')}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => handlePresetRange('week')}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => handlePresetRange('month')}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => handlePresetRange('lastMonth')}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Last Month
                      </button>
                      <button
                        onClick={() => handlePresetRange('allTime')}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        All Time
                      </button>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Custom Range</div>
                      <div className="space-y-2">
                        <DatePicker
                          selected={filters.dateRange.start ? new Date(filters.dateRange.start) : null}
                          onChange={(date) => updateFilter('dateRange', { 
                            ...filters.dateRange, 
                            start: date ? date.toISOString().slice(0, 10) : '' 
                          })}
                          className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholderText="Start Date"
                          maxDate={filters.dateRange.end ? new Date(filters.dateRange.end) : new Date()}
                        />
                        <DatePicker
                          selected={filters.dateRange.end ? new Date(filters.dateRange.end) : null}
                          onChange={(date) => updateFilter('dateRange', { 
                            ...filters.dateRange, 
                            end: date ? date.toISOString().slice(0, 10) : '' 
                          })}
                          className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholderText="End Date"
                          minDate={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                          maxDate={new Date()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center p-2"
                title="Clear all filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 

