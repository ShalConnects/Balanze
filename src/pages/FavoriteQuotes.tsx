import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Heart, Trash2, Search, ChevronUp, ChevronDown, Eye, Filter } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { useRecordSelection } from '../hooks/useRecordSelection';
import { SelectionFilter } from '../components/common/SelectionFilter';
import { searchService } from '../utils/searchService';
import { QuoteSummaryCards } from '../components/Quotes/QuoteSummaryCards';
import { QuoteMobileView } from '../components/Quotes/QuoteMobileView';
import { QuotePageSkeleton } from '../components/Quotes/QuoteSkeleton';
import { toast } from 'sonner';
import { setPreference } from '../lib/userPreferences';

export const FavoriteQuotes: React.FC = () => {
  const { user } = useAuthStore();
  const { favoriteQuotes, removeFavoriteQuote, loadFavoriteQuotes, setCurrentUserId, isLoadingQuotes } = useNotificationStore();
  
  // Check if quote widget is hidden
  const [isQuoteWidgetHidden, setIsQuoteWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showQuoteWidget');
    return saved !== null ? !JSON.parse(saved) : false;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);
  
  // Load favorite quotes and set current user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadFavoriteQuotes(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user?.id, setCurrentUserId, loadFavoriteQuotes]);

  // Show Quote widget on dashboard
  const handleShowQuoteWidget = useCallback(async () => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showQuoteWidget', JSON.stringify(true));
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showQuoteWidget', true);
        toast.success('Quote widget will be shown on dashboard!', {
          description: 'You can hide it again from the dashboard'
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
  }, [user?.id]);

  // Function to restore quote widget to dashboard
  const handleShowQuoteWidgetFromPage = useCallback(async () => {
    console.log('Restoring Quote widget to dashboard');
    setIsRestoringWidget(true);
    
    try {
      // Use the existing function that has proper database sync
      await handleShowQuoteWidget();
      
      // Update local state
      setIsQuoteWidgetHidden(false);
      
      console.log('Quote widget restored, new state:', false);
    } finally {
      setIsRestoringWidget(false);
    }
  }, [handleShowQuoteWidget]);

  // New state for unified table view
  const [tableFilters, setTableFilters] = useState({
    search: '',
    category: ''
  });

  // Mobile filter menu state
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  
  // Temporary filters for mobile modal (like account page)
  const [tempFilters, setTempFilters] = useState({
    category: ''
  });
  
  // Refs for dropdown menus
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
      if (mobileFilterMenuRef.current && !mobileFilterMenuRef.current.contains(event.target as Node)) {
        setShowMobileFilterMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mobile filter modal functions
  const openMobileFilterMenu = () => {
    setTempFilters({
      category: tableFilters.category
    });
    setShowMobileFilterMenu(true);
  };

  const applyMobileFilters = () => {
    console.log('Applying temp filters:', tempFilters);
    console.log('Current tableFilters before update:', tableFilters);
    setTableFilters({ 
      search: tableFilters.search, 
      category: tempFilters.category 
    });
    console.log('Updated tableFilters should be:', { 
      search: tableFilters.search, 
      category: tempFilters.category 
    });
    setShowMobileFilterMenu(false);
  };

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: any[]) => {
    if (!sortConfig) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'quote':
          aValue = a.quote.toLowerCase();
          bValue = b.quote.toLowerCase();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Record selection functionality
  const {
    selectedRecord,
    isFromSearch,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: favoriteQuotes,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // Filter quotes based on search
  const filteredQuotes = useMemo(() => {
    console.log('Filtering quotes with filters:', tableFilters);
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    // First apply basic filters
    let filtered = favoriteQuotes.filter(quote => {
      const matchesCategory = tableFilters.category === '' || quote.category === tableFilters.category;
      console.log(`Quote "${quote.quote}" category: ${quote.category}, filter: ${tableFilters.category}, matches: ${matchesCategory}`);
      return matchesCategory;
    });

    // Apply fuzzy search if search term exists
    if (tableFilters.search && tableFilters.search.trim()) {
      const searchResults = searchService.search(
        filtered,
        tableFilters.search,
        'quotes',
        { 
          threshold: 0.3,
          keys: [
            { name: 'quote', weight: 0.4 },
            { name: 'author', weight: 0.3 },
            { name: 'category', weight: 0.3 }
          ]
        },
        { limit: 1000 }
      );
      
      // Extract items from search results
      filtered = searchResults.map(result => result.item);
    }

    return filtered;
  }, [favoriteQuotes, tableFilters, hasSelection, isFromSearch, selectedRecord]);

  // Sort filtered quotes for table display only
  const filteredQuotesForTable = useMemo(() => {
    return sortData(filteredQuotes);
  }, [filteredQuotes, sortConfig]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'financial':
        return '💰';
      case 'motivation':
        return '💪';
      case 'success':
        return '🎯';
      case 'wisdom':
        return '🧠';
      default:
        return '💭';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'financial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'motivation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'success':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'wisdom':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };



  // Get all unique categories from quotes
  const quoteCategories = Array.from(new Set(favoriteQuotes.map(q => q.category).filter(Boolean))) as string[];

  // Show skeleton while loading
  if (isLoadingQuotes) {
    return <QuotePageSkeleton />;
  }

  if (favoriteQuotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              No Favorite Quotes Yet
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-4">
              Start collecting your favorite motivational quotes by clicking the heart icon on any quote you love!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorite-quotes-page">
      {/* Header */}
      {/* Only keep the header at the top-level layout, remove this one from the body */}



      {/* Unified Table View - New Section */}
      <div className="space-y-6">

        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
              {/* Selection Filter */}
              {hasSelection && selectedRecord && (
                <SelectionFilter
                  label="Selected"
                  value={selectedRecord.quote || 'Quote'}
                  onClear={clearSelection}
                />
              )}

              {/* Search Field */}
              <div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search quotes..."
                    value={tableFilters.search}
                    onChange={(e) => setTableFilters({ ...tableFilters, search: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <div className="relative">
                  <button
                    onClick={openMobileFilterMenu}
                    className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                      (tableFilters.search || tableFilters.category)
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={(tableFilters.search || tableFilters.category) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    title="Filters"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Clear Filters Button */}
              <div className="md:hidden">
                {(tableFilters.search || tableFilters.category) && (
                  <button
                    onClick={() => setTableFilters({ search: '', category: '' })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-x-2">
                <div>
                  <div className="relative" ref={categoryMenuRef}>
                    <button
                      onClick={() => setShowCategoryMenu(v => !v)}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.category 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={tableFilters.category ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.category === '' ? 'All Categories' : (tableFilters.category.charAt(0).toUpperCase() + tableFilters.category.slice(1))}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCategoryMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, category: '' }); setShowCategoryMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.category === '' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Categories
                        </button>
                        {quoteCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => { setTableFilters({ ...tableFilters, category }); setShowCategoryMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.category === category ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            {category ? category.charAt(0).toUpperCase() + category.slice(1) : category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-grow"></div>

              {/* Eye Icon Button - Show when widget is hidden */}
              {isQuoteWidgetHidden && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={handleShowQuoteWidgetFromPage}
                    disabled={isRestoringWidget}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Show Quote Widget on Dashboard"
                    aria-label="Show Quote Widget on Dashboard"
                  >
                    {isRestoringWidget ? (
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Filter Modal */}
          {showMobileFilterMenu && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowMobileFilterMenu(false)}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" ref={mobileFilterMenuRef} onClick={(e) => e.stopPropagation()}>
                {/* Header with Check and Cross */}
                <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Apply button clicked!');
                          applyMobileFilters();
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        className={`p-2 transition-colors touch-manipulation ${
                          tempFilters.category
                            ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 active:opacity-70'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:opacity-70'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                        title="Apply Filters"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTableFilters({ search: '', category: '' });
                          setShowMobileFilterMenu(false);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors touch-manipulation active:opacity-70"
                        style={{ touchAction: 'manipulation' }}
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
                <div className="px-3 py-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Category</div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Mobile filter "All" clicked');
                        setTempFilters({ ...tempFilters, category: '' });
                        console.log('Temp filters after "All" update:', { ...tempFilters, category: '' });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.category === '' 
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    {quoteCategories.map(category => (
                      <button
                        key={category}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Mobile filter category clicked:', category);
                          setTempFilters({ ...tempFilters, category });
                          console.log('Temp filters after update:', { ...tempFilters, category });
                        }}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          tempFilters.category === category 
                            ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                            : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards Section */}
          <QuoteSummaryCards filteredQuotes={filteredQuotesForTable} />


          {/* Table View - Desktop and Tablet */}
          <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
            {/* Desktop Table View */}
            <div className="hidden lg:block max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('quote')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Quote</span>
                        {getSortIcon('quote')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('author')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Author</span>
                        {getSortIcon('author')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredQuotesForTable.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <td className="px-6 py-[1.2rem]">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="max-w-xs sm:max-w-sm md:max-w-md break-words">"{quote.quote}"</div>
                        </div>
                      </td>
                      <td className="px-6 py-[1.2rem]">
                        <div className="text-sm text-gray-600 dark:text-gray-300 break-words">{quote.author}</div>
                      </td>
                      <td className="px-6 py-[1.2rem] text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                          {getCategoryIcon(quote.category)} {quote.category ? quote.category.charAt(0).toUpperCase() + quote.category.slice(1) : 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-[1.2rem] text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-[1.2rem] text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <button
                            onClick={async () => await removeFavoriteQuote(quote.id)}
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden max-h-[500px] overflow-y-auto">
              <QuoteMobileView
                quotes={filteredQuotesForTable}
                onRemoveQuote={removeFavoriteQuote}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
              />
            </div>
          </div>

          {/* Empty State for Filtered Results */}
          {filteredQuotesForTable.length === 0 && favoriteQuotes.length > 0 && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No quotes found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}; 

