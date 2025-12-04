import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Save, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { Tooltip } from '../common/Tooltip';

interface FilterPreset {
  id: string;
  name: string;
  filters: {
    searchTerm: string;
    filterMode: 'all' | 'fixed' | 'percent';
    filterStatus: 'all' | 'donated' | 'pending';
    filterCurrency: string;
    filterDateRange: '1month' | '3months' | '6months' | '1year' | 'custom';
    filterType: 'all' | 'transaction' | 'manual';
    amountRange: { min: number; max: number };
  };
}

interface EnhancedDonationFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterMode: 'all' | 'fixed' | 'percent';
  setFilterMode: (mode: 'all' | 'fixed' | 'percent') => void;
  filterStatus: 'all' | 'donated' | 'pending';
  setFilterStatus: (status: 'all' | 'donated' | 'pending') => void;
  filterCurrency: string;
  setFilterCurrency: (currency: string) => void;
  filterDateRange: '1month' | '3months' | '6months' | '1year' | 'custom';
  setFilterDateRange: (range: '1month' | '3months' | '6months' | '1year' | 'custom') => void;
  filterType: 'all' | 'transaction' | 'manual';
  setFilterType: (type: 'all' | 'transaction' | 'manual') => void;
  availableCurrencies: string[];
  onExport: () => void;
}

export const EnhancedDonationFilters: React.FC<EnhancedDonationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterMode,
  setFilterMode,
  filterStatus,
  setFilterStatus,
  filterCurrency,
  setFilterCurrency,
  filterDateRange,
  setFilterDateRange,
  filterType,
  setFilterType,
  availableCurrencies,
  onExport
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [amountRange, setAmountRange] = useState({ min: 0, max: 10000 });
  const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() });
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Refs for dropdowns
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const presetsMenuRef = useRef<HTMLDivElement>(null);

  // State for dropdown menus
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('donationFilterPresets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {

      }
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = (presets: FilterPreset[]) => {
    localStorage.setItem('donationFilterPresets', JSON.stringify(presets));
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (presetsMenuRef.current && !presetsMenuRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick filter chips
  const quickFilters = [
    { label: 'Today', action: () => setFilterDateRange('custom') },
    { label: 'This Week', action: () => setFilterDateRange('custom') },
    { label: 'This Month', action: () => setFilterDateRange('1month') },
    { label: 'Large Donations', action: () => setAmountRange({ min: 1000, max: 10000 }) },
    { label: 'Small Donations', action: () => setAmountRange({ min: 0, max: 100 }) },
    { label: 'Manual Only', action: () => setFilterType('manual') },
    { label: 'Transaction Only', action: () => setFilterType('transaction') },
  ];

  // Save current filter as preset
  const saveCurrentPreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: {
        searchTerm,
        filterMode,
        filterStatus,
        filterCurrency,
        filterDateRange,
        filterType,
        amountRange
      }
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    setPresetName('');
    setShowSavePreset(false);
  };

  // Load preset
  const loadPreset = (preset: FilterPreset) => {
    setSearchTerm(preset.filters.searchTerm);
    setFilterMode(preset.filters.filterMode);
    setFilterStatus(preset.filters.filterStatus);
    setFilterCurrency(preset.filters.filterCurrency);
    setFilterDateRange(preset.filters.filterDateRange);
    setFilterType(preset.filters.filterType);
    setAmountRange(preset.filters.amountRange);
    setShowPresets(false);
  };

  // Delete preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterMode('all');
    setFilterStatus('all');
    setFilterCurrency('');
    setFilterDateRange('1month');
    setFilterType('all');
    setAmountRange({ min: 0, max: 10000 });
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Smart Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search donations, notes, or transaction IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            showAdvancedFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            onClick={filter.action}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {filter.label}
          </button>
        ))}
        <button
          onClick={clearAllFilters}
          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mode Filter */}
            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span>Mode: {filterMode === 'all' ? 'All' : filterMode}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showModeMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {['all', 'fixed', 'percent'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setFilterMode(mode as 'all' | 'fixed' | 'percent');
                        setShowModeMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {mode === 'all' ? 'All' : mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span>Status: {filterStatus === 'all' ? 'All' : filterStatus}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {['all', 'donated', 'pending'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status as 'all' | 'donated' | 'pending');
                        setShowStatusMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Filter */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span>Currency: {filterCurrency || 'All'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCurrencyMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFilterCurrency('');
                      setShowCurrencyMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                  >
                    All
                  </button>
                  {availableCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => {
                        setFilterCurrency(currency);
                        setShowCurrencyMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg"
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative" ref={dateMenuRef}>
              <button
                onClick={() => setShowDateMenu(!showDateMenu)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span>Date: {filterDateRange}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDateMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {[
                    { value: '1month', label: 'Last Month' },
                    { value: '3months', label: 'Last 3 Months' },
                    { value: '6months', label: 'Last 6 Months' },
                    { value: '1year', label: 'Last Year' },
                    { value: 'custom', label: 'Custom Range' }
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setFilterDateRange(range.value as '1month' | '3months' | '6months' | '1year' | 'custom');
                        setShowDateMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div className="relative" ref={typeMenuRef}>
              <button
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span>Type: {filterType === 'all' ? 'All' : filterType}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTypeMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {['all', 'transaction', 'manual'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type as 'all' | 'transaction' | 'manual');
                        setShowTypeMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount Range Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="self-center text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: Number(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Filter Presets */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Saved Filter Presets</h3>
              <button
                onClick={() => setShowSavePreset(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Save className="w-4 h-4" />
                <span>Save Current</span>
              </button>
            </div>

            {savedPresets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    <button
                      onClick={() => loadPreset(preset)}
                      className="text-sm hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No saved presets. Save your current filter settings for quick access.
              </p>
            )}
          </div>

          {/* Save Preset Modal */}
          {showSavePreset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Filter Preset</h3>
                <input
                  type="text"
                  placeholder="Enter preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={saveCurrentPreset}
                    disabled={!presetName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSavePreset(false);
                      setPresetName('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 

