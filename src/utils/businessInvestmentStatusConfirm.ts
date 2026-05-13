import type { ContractStatus } from '../types/businessInvestment';

/** Copy for `DeleteConfirmationModal` when changing contract active/closed status. */
export function businessInvestmentStatusConfirmCopy(next: ContractStatus, contractTitle: string) {
  const closing = next === 'closed';
  return {
    title: closing ? 'Close contract?' : 'Reopen contract?',
    message: closing
      ? 'This contract will be marked closed. It leaves active summaries, and you cannot add new profit, loss, or return entries until you reopen it. History stays available.'
      : 'This contract will be marked active again. It counts in active summaries and you can add new entries.',
    confirmLabel: closing ? 'Close contract' : 'Reopen contract',
    recordTitle: contractTitle
  };
}
