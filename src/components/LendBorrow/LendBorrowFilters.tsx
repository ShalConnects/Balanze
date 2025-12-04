import React, { useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface LendBorrowFiltersProps {
  filters: {
    search: string;
    currency: string;
    type: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  currencyOptions: string[];
  recordTypes: string[];
}

export const LendBorrowFilters: React.FC<LendBorrowFiltersProps> = ({
  filters,
  onFiltersChange,
  currencyOptions,
  recordTypes
}) => {
  const [showCurrencyMenu, setShowCurrencyMenu] = React.useState(false);
  const [showTypeMenu, setShowTypeMenu] = React.useState(false);
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({ search: '', currency: '', type: 'all', status: 'active' });
  };

  const hasActiveFilters = filters.search || filters.currency || filters.type !== 'all' || filters.status !== 'active';

  return (
    <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full" style={{ marginBottom: 0 }}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* Search Filter */}
        <div>
          <div className="relative">
            <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                filters.search 
                  ? 'border-blue-300 dark:border-blue-600' 
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
              style={filters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
              placeholder="Search records..."
            />
          </div>
        </div>

        {/* Currency Filter */}
        <div>
          <div className="relative" ref={currencyMenuRef}>
            <button
              onClick={() => setShowCurrencyMenu(v => !v)}
              className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                filters.currency 
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
            >
              <span>{filters.currency === '' ? 'All Currencies' : filters.currency}</span>
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCurrencyMenu && (
              <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                <button
                  onClick={() => { updateFilter('currency', ''); setShowCurrencyMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  All Currencies
                </button>
                {currencyOptions.map(currency => (
                  <button
                    key={currency}
                    onClick={() => { updateFilter('currency', currency); setShowCurrencyMenu(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {currency}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <div className="relative" ref={typeMenuRef}>
            <button
              onClick={() => setShowTypeMenu(v => !v)}
              className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                filters.type !== 'all'
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filters.type !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
            >
              <span>{filters.type === 'all' ? 'All Types' : filters.type === 'lend' ? 'Lend' : 'Borrow'}</span>
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTypeMenu && (
              <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => { updateFilter('type', 'all'); setShowTypeMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  All Types
                </button>
                <button
                  onClick={() => { updateFilter('type', 'lend'); setShowTypeMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Lend
                </button>
                <button
                  onClick={() => { updateFilter('type', 'borrow'); setShowTypeMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Borrow
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                filters.status !== 'active'
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filters.status !== 'active' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
            >
              <span>{filters.status === 'all' ? 'All Status' : filters.status}</span>
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatusMenu && (
              <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => { updateFilter('status', 'all'); setShowStatusMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  All Status
                </button>
                <button
                  onClick={() => { updateFilter('status', 'active'); setShowStatusMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Active
                </button>
                <button
                  onClick={() => { updateFilter('status', 'settled'); setShowStatusMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Settled
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center">
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-1 px-3 py-1.5 text-[13px] h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
};
