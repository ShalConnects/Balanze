import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { exportTransactions, ExportOptions, ExportResult } from '../utils/exportUtils';
import { FilterState, SortConfig } from '../types/export';

interface UseExportOptions {
  transactions: any[];
  accounts: any[];
  filters?: FilterState;
  sortConfig?: SortConfig;
}

interface UseExportReturn {
  isExporting: boolean;
  exportFormat: string | null;
  exportToCSV: () => Promise<void>;
  exportToPDF: () => Promise<void>;
  exportToHTML: () => Promise<void>;
  lastExportResult: ExportResult | null;
}

export const useExport = (options: UseExportOptions): UseExportReturn => {
  const { transactions, accounts, filters, sortConfig } = options;
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);

  const handleExport = useCallback(async (
    format: 'csv' | 'pdf' | 'html',
    customFilename?: string
  ) => {
    if (isExporting) {
      toast.warning('Export already in progress');
      return;
    }

    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    try {
      const exportOptions: ExportOptions = {
        transactions,
        accounts,
        format,
        filename: customFilename,
        includeFilters: true,
        filters,
        sortConfig
      };

      const result = await exportTransactions(exportOptions);
      setLastExportResult(result);

      if (result.success) {
        toast.success(`Export completed: ${result.filename}`, {
          description: `${transactions.length} transactions exported successfully`
        });
      } else {
        toast.error('Export failed', {
          description: result.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Export failed', {
        description: errorMessage
      });
      
      setLastExportResult({
        success: false,
        filename: '',
        error: errorMessage
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [isExporting, transactions, accounts, filters, sortConfig]);

  const exportToCSV = useCallback(() => handleExport('csv'), [handleExport]);
  const exportToPDF = useCallback(() => handleExport('pdf'), [handleExport]);
  const exportToHTML = useCallback(() => handleExport('html'), [handleExport]);

  return {
    isExporting,
    exportFormat,
    exportToCSV,
    exportToPDF,
    exportToHTML,
    lastExportResult
  };
};
