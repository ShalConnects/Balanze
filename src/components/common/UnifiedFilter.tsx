import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

export interface FilterConfig {
  search: boolean;
  category: boolean;
  status: boolean;
  currency: boolean;
  type: boolean;
}

export interface FilterOptions {
  categories?: string[];
  currencies?: string[];
  types?: string[];
  statuses?: { value: string; label: string }[];
}

export interface UnifiedFilterProps {
  filters: {
    search: string;
    category: string;
    status: string;
    currency: string;
    type: string;
  };
  onFiltersChange: (filters: any) => void;
  config: FilterConfig;
  options: FilterOptions;
  placeholder?: string;
  className?: string;
}

export const UnifiedFilter: React.FC<UnifiedFilterProps> = ({
  filters,
  onFiltersChange,
  config,
  options,
  placeholder = "Search...",
  className = ""
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Refs for dropdown menus
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement>(null);

  // Sync tempFilters with filters when modal opens
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(filters);
    }
  }, [showMobileFilterMenu, filters]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (mobileFilterMenuRef.current && !mobileFilterMenuRef.current.contains(event.target as Node)) {
        setShowMobileFilterMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle closing modal without applying filters
  const handleCloseModal = () => {
    setShowMobileFilterMenu(false);
    setTempFilters(filters);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileFilterMenu) {
        handleCloseModal();
      }
    };

    if (showMobileFilterMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMobileFilterMenu]);

  const getFilterButtonClass = (isActive: boolean) => {
    return `flex items-center gap-1 px-2 py-1.5 text-xs border rounded-md transition-colors ${
      isActive 
        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;
  };

  const getFilterChipClass = (isActive: boolean) => {
    return `px-2 py-1 text-xs rounded-full border transition-colors ${
      isActive 
        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;
  };

  return (
    <>
      <div className={`p-3 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* Search Input */}
          {config.search && (
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  placeholder={placeholder}
                />
              </div>
            </div>
          )}

          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <div className="relative" ref={mobileFilterMenuRef}>
              <button
                onClick={() => setShowMobileFilterMenu(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Filters
              </button>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-2">
            {/* Category Filter */}
            {config.category && options.categories && (
              <div className="relative" ref={categoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className={getFilterButtonClass(!!filters.category)}
                >
                  Category
                  {filters.category && <span className="ml-1">({filters.category})</span>}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showCategoryMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        onFiltersChange({ ...filters, category: '' });
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      All Categories
                    </button>
                    {options.categories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: category || '' });
                          setShowCategoryMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status Filter */}
            {config.status && options.statuses && (
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={getFilterButtonClass(filters.status !== 'active')}
                >
                  Status
                  {filters.status !== 'active' && <span className="ml-1">({filters.status})</span>}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                    {options.statuses.map(status => (
                      <button
                        key={status.value}
                        onClick={() => {
                          onFiltersChange({ ...filters, status: status.value });
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Currency Filter */}
            {config.currency && options.currencies && (
              <div className="relative" ref={currencyMenuRef}>
                <button
                  onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                  className={getFilterButtonClass(!!filters.currency)}
                >
                  Currency
                  {filters.currency && <span className="ml-1">({filters.currency})</span>}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showCurrencyMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        onFiltersChange({ ...filters, currency: '' });
                        setShowCurrencyMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      All Currencies
                    </button>
                    {options.currencies.map(currency => (
                      <button
                        key={currency}
                        onClick={() => {
                          onFiltersChange({ ...filters, currency: currency || '' });
                          setShowCurrencyMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type Filter */}
            {config.type && options.types && (
              <div className="relative" ref={typeMenuRef}>
                <button
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className={getFilterButtonClass(filters.type !== 'all')}
                >
                  Type
                  {filters.type !== 'all' && <span className="ml-1">({filters.type})</span>}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showTypeMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        onFiltersChange({ ...filters, type: 'all' });
                        setShowTypeMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      All Types
                    </button>
                    {options.types.map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          onFiltersChange({ ...filters, type: type || '' });
                          setShowTypeMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilterMenu && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onFiltersChange(tempFilters);
                      setShowMobileFilterMenu(false);
                    }}
                    className={`p-1 transition-colors ${
                      (tempFilters.category || tempFilters.status !== 'active' || tempFilters.currency || tempFilters.type !== 'all')
                        ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    title="Apply Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      onFiltersChange({ search: '', category: '', status: 'active', currency: '', type: 'all' });
                      setShowMobileFilterMenu(false);
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Clear All Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Category Filter */}
            {config.category && options.categories && (
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Category</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, category: '' });
                    }}
                    className={getFilterChipClass(tempFilters.category === '')}
                  >
                    All
                  </button>
                  {options.categories.map(category => (
                    <button
                      key={category}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, category: category || '' });
                      }}
                      className={getFilterChipClass(tempFilters.category === category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status Filter */}
            {config.status && options.statuses && (
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  {options.statuses.map(status => (
                    <button
                      key={status.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, status: status.value });
                      }}
                      className={getFilterChipClass(tempFilters.status === status.value)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Currency Filter */}
            {config.currency && options.currencies && (
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Currency</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, currency: '' });
                    }}
                    className={getFilterChipClass(tempFilters.currency === '')}
                  >
                    All
                  </button>
                  {options.currencies.map(currency => (
                    <button
                      key={currency}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, currency: currency || '' });
                      }}
                      className={getFilterChipClass(tempFilters.currency === currency)}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Filter */}
            {config.type && options.types && (
              <div className="px-3 py-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'all' });
                    }}
                    className={getFilterChipClass(tempFilters.type === 'all')}
                  >
                    All
                  </button>
                  {options.types.map(type => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, type: type || '' });
                      }}
                      className={getFilterChipClass(tempFilters.type === type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
