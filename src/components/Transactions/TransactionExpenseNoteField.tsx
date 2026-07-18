import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { TransactionNoteModal } from './TransactionNoteModal';

/** Form trigger that opens the shared expense-note modal (same path as the note icon). */
export const TransactionExpenseNoteField: React.FC<{
  transactionId?: string;
  noteSummary: string;
  draftRawText?: string;
  disabled?: boolean;
  className?: string;
  onCommitted: (summary: string, rawText: string) => void | Promise<void>;
}> = ({ transactionId, noteSummary, draftRawText, disabled, className = '', onCommitted }) => {
  const [open, setOpen] = useState(false);
  const hasNote = noteSummary.trim().length > 0;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full flex items-start gap-2 text-left ${className}`.trim()}
      >
        <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${hasNote ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
        <span className={`text-[14px] whitespace-pre-wrap break-words ${hasNote ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
          {hasNote ? noteSummary : 'Add expense note…'}
        </span>
      </button>
      <TransactionNoteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        transactionId={transactionId}
        currentNote={noteSummary}
        draftRawText={draftRawText}
        onSave={async (summary, rawText = '') => {
          await onCommitted(summary, rawText);
        }}
      />
    </>
  );
};
