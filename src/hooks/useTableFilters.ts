import { useState, useCallback } from 'react';

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

export interface TableFilters {
  search: string;
  category: string;
  status: string;
  currency: string;
  type: string;
}

export const useTableFilters = (
  initialFilters: Partial<TableFilters> = {},
  config: FilterConfig,
  options: FilterOptions
) => {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    category: '',
    status: 'active',
    currency: '',
    type: 'all',
    ...initialFilters
  });

  const updateFilters = useCallback((newFilters: Partial<TableFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      status: 'active',
      currency: '',
      type: 'all'
    });
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.search !== '' ||
      filters.category !== '' ||
      filters.status !== 'active' ||
      filters.currency !== '' ||
      filters.type !== 'all'
    );
  }, [filters]);

  const getFilterSummary = useCallback(() => {
    const activeFilters = [];
    
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.category) activeFilters.push(`Category: ${filters.category}`);
    if (filters.status !== 'active') activeFilters.push(`Status: ${filters.status}`);
    if (filters.currency) activeFilters.push(`Currency: ${filters.currency}`);
    if (filters.type !== 'all') activeFilters.push(`Type: ${filters.type}`);
    
    return activeFilters;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters: hasActiveFilters(),
    getFilterSummary,
    config,
    options
  };
};
