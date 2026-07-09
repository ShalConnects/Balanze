export type ContractStatus = 'active' | 'closed';
export type ContractStatusFilter = 'all' | ContractStatus;
export const DEFAULT_CONTRACT_STATUS_FILTER: ContractStatusFilter = 'active';
export type EntryType = 'profit' | 'loss' | 'principal_return' | 'capital_contribution';

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  profit: 'Profit',
  loss: 'Loss',
  principal_return: 'Principal Returned',
  capital_contribution: 'Capital contribution'
};

export interface InvestmentEntry {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  note?: string;
  /** `transactions.transaction_id` when this entry was posted from the tracker */
  linked_transaction_id?: string | null;
}

export interface InvestmentContract {
  id: string;
  title: string;
  principal: number;
  currency: string;
  funding_account_id: string;
  funding_account_name?: string;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
  note?: string;
  entries: InvestmentEntry[];
  created_at: string;
}
