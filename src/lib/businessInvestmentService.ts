import { supabase } from './supabase';
import type { ContractStatus, EntryType, InvestmentContract, InvestmentEntry } from '../types/businessInvestment';

type DbContract = {
  id: string;
  title: string;
  principal: string | number;
  currency: string;
  funding_account_id: string;
  funding_account_name: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  note: string | null;
  created_at: string;
};

type DbEntry = {
  id: string;
  contract_id: string;
  type: string;
  amount: string | number;
  date: string;
  note: string | null;
};

function mapEntry(row: DbEntry): InvestmentEntry {
  return {
    id: row.id,
    type: row.type as EntryType,
    amount: Number(row.amount),
    date: row.date,
    note: row.note ?? undefined
  };
}

function mapContract(row: DbContract, entries: InvestmentEntry[]): InvestmentContract {
  return {
    id: row.id,
    title: row.title,
    principal: Number(row.principal),
    currency: row.currency || 'USD',
    funding_account_id: row.funding_account_id,
    funding_account_name: row.funding_account_name ?? undefined,
    start_date: row.start_date,
    end_date: row.end_date ?? undefined,
    status: row.status as ContractStatus,
    note: row.note ?? undefined,
    entries,
    created_at: row.created_at
  };
}

export async function fetchBusinessInvestmentContracts(userId: string | undefined): Promise<InvestmentContract[]> {
  if (!userId) return [];

  const { data: rows, error: cErr } = await supabase
    .from('business_investment_contracts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (cErr) throw cErr;
  const contracts = (rows || []) as DbContract[];
  if (contracts.length === 0) return [];

  const ids = contracts.map((c) => c.id);
  const { data: entryRows, error: eErr } = await supabase
    .from('business_investment_entries')
    .select('*')
    .in('contract_id', ids)
    .order('date', { ascending: false });

  if (eErr) throw eErr;

  const byContract = new Map<string, InvestmentEntry[]>();
  for (const er of (entryRows || []) as DbEntry[]) {
    const list = byContract.get(er.contract_id) || [];
    list.push(mapEntry(er));
    byContract.set(er.contract_id, list);
  }

  return contracts.map((c) => mapContract(c, byContract.get(c.id) || []));
}

export async function insertBusinessInvestmentContract(
  input: Omit<InvestmentContract, 'id' | 'entries' | 'created_at'>
): Promise<InvestmentContract> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('business_investment_contracts')
    .insert({
      user_id: uid,
      title: input.title,
      principal: input.principal,
      currency: input.currency,
      funding_account_id: input.funding_account_id,
      funding_account_name: input.funding_account_name ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      status: input.status,
      note: input.note ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return mapContract(data as DbContract, []);
}

export type BusinessInvestmentContractDetailsPatch = {
  title: string;
  start_date: string;
  end_date: string | null;
  note: string | null;
};

export async function updateBusinessInvestmentContractDetails(id: string, patch: BusinessInvestmentContractDetailsPatch): Promise<void> {
  const { error } = await supabase
    .from('business_investment_contracts')
    .update({
      title: patch.title,
      start_date: patch.start_date,
      end_date: patch.end_date,
      note: patch.note
    })
    .eq('id', id);
  if (error) throw error;
}

export async function updateBusinessInvestmentContractStatus(id: string, status: ContractStatus): Promise<void> {
  const { error } = await supabase.from('business_investment_contracts').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteBusinessInvestmentContract(id: string): Promise<void> {
  const { error } = await supabase.from('business_investment_contracts').delete().eq('id', id);
  if (error) throw error;
}

export async function insertBusinessInvestmentEntry(
  contractId: string,
  input: Omit<InvestmentEntry, 'id'>
): Promise<InvestmentEntry> {
  const { data, error } = await supabase
    .from('business_investment_entries')
    .insert({
      contract_id: contractId,
      type: input.type,
      amount: input.amount,
      date: input.date,
      note: input.note ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return mapEntry(data as DbEntry);
}

export async function deleteBusinessInvestmentEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('business_investment_entries').delete().eq('id', entryId);
  if (error) throw error;
}
