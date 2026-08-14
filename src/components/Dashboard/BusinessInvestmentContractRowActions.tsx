import React from 'react';
import { Ban, Download, Eye, Loader2, Pencil, PlayCircle, Trash2, TrendingUp } from 'lucide-react';
import type { InvestmentContract } from '../../types/businessInvestment';

const rowActionIconButtonClass =
  'p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

export interface BusinessInvestmentContractRowActionsProps {
  contract: InvestmentContract;
  pdfBusy?: boolean;
  onView: (contract: InvestmentContract) => void;
  onDownload: (contract: InvestmentContract) => void;
  onUpdate: (contract: InvestmentContract) => void;
  onToggleStatus: (contractId: string) => void;
  onEdit: (contract: InvestmentContract) => void;
  onDelete: (contractId: string) => void;
}

export const BusinessInvestmentContractRowActions: React.FC<BusinessInvestmentContractRowActionsProps> = ({
  contract,
  pdfBusy = false,
  onView,
  onDownload,
  onUpdate,
  onToggleStatus,
  onEdit,
  onDelete
}) => (
  <div className="flex items-center gap-0.5">
    {contract.status === 'active' ? (
      <button
        type="button"
        onClick={() => onUpdate(contract)}
        className={rowActionIconButtonClass}
        title="Record update"
        aria-label="Record update"
      >
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    ) : null}
    <button
      type="button"
      onClick={() => onView(contract)}
      disabled={pdfBusy}
      className={rowActionIconButtonClass}
      title="View agreement"
      aria-label="View agreement"
    >
      {pdfBusy ? (
        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
      ) : (
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      )}
    </button>
    <button
      type="button"
      onClick={() => onDownload(contract)}
      disabled={pdfBusy}
      className={rowActionIconButtonClass}
      title="Download agreement PDF"
      aria-label="Download agreement PDF"
    >
      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
    <button
      type="button"
      onClick={() => onToggleStatus(contract.id)}
      className={rowActionIconButtonClass}
      title={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
      aria-label={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
    >
      {contract.status === 'active' ? (
        <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      ) : (
        <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      )}
    </button>
    <button
      type="button"
      onClick={() => onEdit(contract)}
      className={rowActionIconButtonClass}
      title="Edit contract details"
      aria-label="Edit contract details"
    >
      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
    <button
      type="button"
      onClick={() => onDelete(contract.id)}
      className={rowActionIconButtonClass}
      title="Delete contract"
      aria-label="Delete contract"
    >
      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  </div>
);
