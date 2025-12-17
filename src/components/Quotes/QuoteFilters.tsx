import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface QuoteFiltersProps {
  filters: {
    search: string;
    category: string;
  };
  onFiltersChange: (filters: any) => void;
  quoteCategories: string[];
}

export const QuoteFilters: React.FC<QuoteFiltersProps> = ({
  filters,
  onFiltersChange,
  quoteCategories
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({ search: '', category: '' });
  };

  const hasActiveFilters = filters.search || filters.category;

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
              placeholder="Search quotes..."
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => setShowCategoryMenu(v => !v)}
              className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                filters.category 
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filters.category ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
            >
              <span>{filters.category === '' ? 'All Categories' : filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}</span>
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoryMenu && (
              <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                <button
                  onClick={() => { updateFilter('category', ''); setShowCategoryMenu(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === '' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                >
                  All Categories
                </button>
                {quoteCategories.map(category => {
                  const capitalizedCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : category;
                  return (
                    <button
                      key={category}
                      onClick={() => { updateFilter('category', category); setShowCategoryMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === category ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                    >
                      {capitalizedCategory}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
            title="Clear all filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
