// PDF libraries loaded dynamically to reduce initial bundle size
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
import { FilterState, SortConfig, ExportOptions, ExportResult, FilterSummary } from '../types/export';
import { formatTransactionDescription } from './transactionDescriptionFormatter';

/**
 * Generate a smart filename based on active filters
 */
export const generateExportFilename = (
  format: 'csv' | 'pdf' | 'html',
  filters?: FilterState,
  recordCount?: number
): string => {
  const date = new Date().toISOString().split('T')[0];
  const extension = format.toUpperCase();
  
  if (!filters || !hasActiveFilters(filters)) {
    return `transactions-${date}.${format}`;
  }

  const parts: string[] = [];
  
  // Add search term if present
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim().substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-');
    parts.push(`search-${searchTerm}`);
  }
  
  // Add transaction type if not 'all'
  if (filters.type !== 'all') {
    parts.push(filters.type);
  }
  
  // Add account filter if not 'all'
  if (filters.account !== 'all') {
    parts.push('account-filtered');
  }
  
  // Add currency filter if present
  if (filters.currency) {
    parts.push(filters.currency.toLowerCase());
  }
  
  // Add date range indicator
  if (filters.dateRange.start && filters.dateRange.end) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    const today = new Date();
    
    // Check for common date ranges
    if (filters.dateRange.start === filters.dateRange.end) {
      parts.push('single-day');
    } else if (isThisMonth(startDate, endDate, today)) {
      parts.push('this-month');
    } else if (isThisYear(startDate, endDate, today)) {
      parts.push('this-year');
    } else {
      parts.push('date-range');
    }
  }
  
  // Add modified filter if active
  if (filters.showModifiedOnly) {
    parts.push('recently-modified');
  }
  
  // If multiple filters, use generic name
  if (parts.length > 2) {
    parts.length = 0;
    parts.push('filtered');
  }
  
  // Add record count if provided
  if (recordCount !== undefined && recordCount > 0) {
    parts.push(`${recordCount}-records`);
  }
  
  const filterSuffix = parts.length > 0 ? `-${parts.join('-')}` : '';
  return `transactions${filterSuffix}-${date}.${format}`;
};

/**
 * Check if any filters are active
 */
export const hasActiveFilters = (filters: FilterState): boolean => {
  return !!(
    (filters.search && filters.search.trim()) ||
    filters.type !== 'all' ||
    filters.account !== 'all' ||
    filters.currency ||
    (filters.dateRange.start && filters.dateRange.end) ||
    filters.showModifiedOnly
  );
};

/**
 * Generate filter summary for export metadata
 */
export const generateFilterSummary = (
  transactions: any[],
  filters?: FilterState,
  accounts?: any[]
): FilterSummary => {
  // Calculate financial totals
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netAmount = totalIncome - totalExpense;
  
  // Get currency from first transaction or default to USD
  const currency = transactions.length > 0 
    ? accounts?.find(a => a.id === transactions[0].account_id)?.currency || 'USD'
    : 'USD';

  if (!filters) {
    return {
      hasFilters: false,
      activeFilters: [],
      recordCount: transactions.length,
      totalIncome,
      totalExpense,
      netAmount,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      currency
    };
  }

  const activeFilters: string[] = [];
  
  if (filters.search && filters.search.trim()) {
    activeFilters.push(`Search: "${filters.search}"`);
  }
  
  if (filters.type !== 'all') {
    activeFilters.push(`Type: ${filters.type}`);
  }
  
  if (filters.account !== 'all') {
    const account = accounts?.find(a => a.id === filters.account);
    activeFilters.push(`Account: ${account?.name || 'Unknown'}`);
  }
  
  if (filters.currency) {
    activeFilters.push(`Currency: ${filters.currency}`);
  }
  
  if (filters.dateRange.start && filters.dateRange.end) {
    const startDate = new Date(filters.dateRange.start).toLocaleDateString();
    const endDate = new Date(filters.dateRange.end).toLocaleDateString();
    activeFilters.push(`Date Range: ${startDate} - ${endDate}`);
  }
  
  if (filters.showModifiedOnly) {
    activeFilters.push(`Recently Modified: ${filters.recentlyModifiedDays} days`);
  }

  return {
    hasFilters: activeFilters.length > 0,
    activeFilters,
    recordCount: transactions.length,
    dateRange: filters.dateRange.start && filters.dateRange.end 
      ? `${filters.dateRange.start} to ${filters.dateRange.end}` 
      : undefined,
    searchTerm: filters.search || undefined,
    transactionType: filters.type !== 'all' ? filters.type : undefined,
    accountName: filters.account !== 'all' ? accounts?.find(a => a.id === filters.account)?.name : undefined,
    currency: filters.currency || currency,
    totalIncome,
    totalExpense,
    netAmount,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length
  };
};

/**
 * Format currency amount for display
 */
export const formatCurrencyAmount = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format transaction data for export
 */
export const formatTransactionForExport = (transaction: any, accounts: any[]): any[] => {
  const account = accounts.find(a => a.id === transaction.account_id);
  const isTransfer = transaction.tags?.includes('transfer') || transaction.tags?.includes('dps_transfer');
  
  return [
    new Date(transaction.date).toLocaleDateString(),
    formatTransactionDescription(transaction.description || ''),
    transaction.category || '',
    account?.name || 'Unknown',
    isTransfer ? 'Transfer' : transaction.type,
    transaction.amount,
    (transaction.tags || []).join('; ')
  ];
};

/**
 * Export transactions to CSV format
 */
export const exportToCSV = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    const { transactions, accounts, filters, filename } = options;
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    const csvData = transactions.map(transaction => formatTransactionForExport(transaction, accounts));
    
    let csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    // Add filter summary if filters are active
    if (filters && hasActiveFilters(filters)) {
      const summary = generateFilterSummary(transactions, filters, accounts);
      const summaryHeader = '\n\n# Export Summary\n';
      const filterInfo = summary.activeFilters.map(filter => `# ${filter}`).join('\n');
      const recordCount = `# Records: ${summary.recordCount}`;
      const exportDate = `# Exported: ${new Date().toLocaleString()}`;
      
      // Add financial summary
      const financialSummary = `\n# Financial Summary:\n` +
        `# Total Income: ${formatCurrencyAmount(summary.totalIncome, summary.currency)}\n` +
        `# Total Expenses: ${formatCurrencyAmount(summary.totalExpense, summary.currency)}\n` +
        `# Net Amount: ${formatCurrencyAmount(summary.netAmount, summary.currency)}\n` +
        `# Income Transactions: ${summary.incomeCount}\n` +
        `# Expense Transactions: ${summary.expenseCount}\n`;
      
      csvContent = summaryHeader + filterInfo + '\n' + recordCount + '\n' + exportDate + financialSummary + '\n' + csvContent;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || generateExportFilename('csv', filters, transactions.length);
    a.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: a.download
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Export transactions to PDF format
 */
export const exportToPDF = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    // Dynamically import PDF libraries only when needed (lazy load)
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    const { transactions, accounts, filters, filename } = options;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Transaction Report', 14, 22);
    
    // Add export metadata
    let yPosition = 30;
    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Records: ${transactions.length}`, 14, yPosition);
    
    // Add filter information if filters are active
    if (filters && hasActiveFilters(filters)) {
      const summary = generateFilterSummary(transactions, filters, accounts);
      yPosition += 6;
      doc.text('Applied Filters:', 14, yPosition);
      yPosition += 6;
      
      summary.activeFilters.forEach(filter => {
        doc.text(`• ${filter}`, 20, yPosition);
        yPosition += 5;
      });
      
      // Add financial summary
      yPosition += 10;
      doc.setFontSize(12);
      doc.text('Financial Summary:', 14, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.text(`Total Income: ${formatCurrencyAmount(summary.totalIncome, summary.currency)}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total Expenses: ${formatCurrencyAmount(summary.totalExpense, summary.currency)}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Net Amount: ${formatCurrencyAmount(summary.netAmount, summary.currency)}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Income Transactions: ${summary.incomeCount}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Expense Transactions: ${summary.expenseCount}`, 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 10;
    
    // Prepare table data
    const headers = [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags']];
    const rows = transactions.map(transaction => formatTransactionForExport(transaction, accounts));
    
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: yPosition,
      margin: { top: yPosition },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    const finalFilename = filename || generateExportFilename('pdf', filters, transactions.length);
    doc.save(finalFilename);
    
    return {
      success: true,
      filename: finalFilename
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Export transactions to HTML format
 */
export const exportToHTML = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    const { transactions, accounts, filters, filename } = options;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #428bca; color: white; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .summary { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; border-left: 4px solid #428bca; }
        </style>
      </head>
      <body>
        <h1>Transaction Report</h1>
    `;
    
    // Add filter summary if filters are active
    if (filters && hasActiveFilters(filters)) {
      const summary = generateFilterSummary(transactions, filters, accounts);
      html += `
        <div class="summary">
          <h3>Export Summary</h3>
          <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Records:</strong> ${summary.recordCount}</p>
          ${summary.activeFilters.length > 0 ? `
            <p><strong>Applied Filters:</strong></p>
            <ul>
              ${summary.activeFilters.map(filter => `<li>${filter}</li>`).join('')}
            </ul>
          ` : ''}
          
          <div class="financial-summary" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #007bff;">Financial Summary</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div><strong>Total Income:</strong> ${formatCurrencyAmount(summary.totalIncome, summary.currency)}</div>
              <div><strong>Total Expenses:</strong> ${formatCurrencyAmount(summary.totalExpense, summary.currency)}</div>
              <div><strong>Net Amount:</strong> <span style="color: ${summary.netAmount >= 0 ? '#28a745' : '#dc3545'}">${formatCurrencyAmount(summary.netAmount, summary.currency)}</span></div>
              <div><strong>Income Transactions:</strong> ${summary.incomeCount}</div>
              <div><strong>Expense Transactions:</strong> ${summary.expenseCount}</div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Add table
    html += '<table><thead><tr>';
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    html += headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    
    transactions.forEach(transaction => {
      const rowData = formatTransactionForExport(transaction, accounts);
      html += '<tr>' + rowData.map(field => `<td>${String(field).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + '</tr>';
    });
    
    html += '</tbody></table></body></html>';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || generateExportFilename('html', filters, transactions.length);
    a.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: a.download
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Main export function that handles all formats
 */
export const exportTransactions = async (options: ExportOptions): Promise<ExportResult> => {
  const { format } = options;
  
  switch (format) {
    case 'csv':
      return await exportToCSV(options);
    case 'pdf':
      return await exportToPDF(options);
    case 'html':
      return await exportToHTML(options);
    default:
      return {
        success: false,
        filename: '',
        error: `Unsupported format: ${format}`
      };
  }
};

// Helper functions for date range detection
const isThisMonth = (startDate: Date, endDate: Date, today: Date): boolean => {
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return startDate.getTime() === firstOfMonth.getTime() && endDate.getTime() === lastOfMonth.getTime();
};

const isThisYear = (startDate: Date, endDate: Date, today: Date): boolean => {
  const firstOfYear = new Date(today.getFullYear(), 0, 1);
  const lastOfYear = new Date(today.getFullYear(), 11, 31);
  return startDate.getTime() === firstOfYear.getTime() && endDate.getTime() === lastOfYear.getTime();
};
