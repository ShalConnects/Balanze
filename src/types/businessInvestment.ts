export type ContractStatus = 'active' | 'closed';
export type EntryType = 'profit' | 'loss' | 'principal_return';

export interface InvestmentEntry {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  note?: string;
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
