export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  account: string;
  currency: string;
  dateRange: { start: string; end: string };
  showModifiedOnly: boolean;
  recentlyModifiedDays: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface ExportOptions {
  transactions: any[];
  accounts: any[];
  format: 'csv' | 'pdf' | 'html';
  filename?: string;
  includeFilters?: boolean;
  filters?: FilterState;
  sortConfig?: SortConfig;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

export interface FilterSummary {
  hasFilters: boolean;
  activeFilters: string[];
  recordCount: number;
  dateRange?: string;
  searchTerm?: string;
  transactionType?: string;
  accountName?: string;
  currency?: string;
  // Financial summary fields
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
  currency: string;
}
