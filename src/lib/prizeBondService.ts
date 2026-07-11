import { supabase } from './supabase';
import { normalizeBondNumber, parseBondNumbersFromText, summarizePrizeBonds, type PrizeBondDashboardSummary } from './prizeBondUtils';
import { buildScanLearnHints } from './prizeBondScanLearn';
import { logPrizeBond } from './prizeBondScanLog';
import { apiUrl } from '../utils/apiUrl';
import type { PrizeBond, PrizeBondScanFeedback, PrizeBondWin, ScanLearnHints } from '../types/prizeBond';

type DbBond = { id: string; bond_number: string; denomination: number; created_at: string; updated_at: string };
type DbWin = {
  id: string; bond_id: string; bond_number: string; prize_tier: string;
  prize_amount: string | number; draw_date: string; series: string | null;
  notified_at: string | null; created_at: string;
};

const mapBond = (r: DbBond): PrizeBond => ({
  id: r.id, bond_number: r.bond_number, denomination: r.denomination,
  created_at: r.created_at, updated_at: r.updated_at,
});

const mapWin = (r: DbWin): PrizeBondWin => ({
  id: r.id, bond_id: r.bond_id, bond_number: r.bond_number, prize_tier: r.prize_tier,
  prize_amount: Number(r.prize_amount), draw_date: r.draw_date,
  series: r.series ?? undefined, notified_at: r.notified_at ?? undefined, created_at: r.created_at,
});

export async function fetchPrizeBonds(userId: string): Promise<PrizeBond[]> {
  const { data, error } = await supabase.from('prize_bonds').select('*').eq('user_id', userId).order('bond_number');
  if (error) throw error;
  return (data as DbBond[]).map(mapBond);
}

export async function fetchPrizeBondWins(userId: string): Promise<PrizeBondWin[]> {
  const { data, error } = await supabase.from('prize_bond_wins').select('*').eq('user_id', userId).order('draw_date', { ascending: false });
  if (error) throw error;
  return (data as DbWin[]).map(mapWin);
}

export async function loadPrizeBondDashboardSummary(userId: string): Promise<PrizeBondDashboardSummary> {
  const [bonds, wins] = await Promise.all([fetchPrizeBonds(userId), fetchPrizeBondWins(userId)]);
  return summarizePrizeBonds(bonds, wins);
}

export async function addPrizeBond(userId: string, rawNumber: string): Promise<PrizeBond> {
  const bond_number = normalizeBondNumber(rawNumber);
  if (!bond_number) throw new Error('INVALID_BOND_NUMBER');
  const { data, error } = await supabase.from('prize_bonds').insert({ user_id: userId, bond_number }).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('DUPLICATE_BOND');
    throw error;
  }
  return mapBond(data as DbBond);
}

export async function addPrizeBondsBulk(userId: string, raw: string): Promise<{ added: number; skipped: number }> {
  const numbers = parseBondNumbersFromText(raw);
  if (!numbers.length) return { added: 0, skipped: 0 };
  const rows = numbers.map((bond_number) => ({ user_id: userId, bond_number }));
  const { data, error } = await supabase.from('prize_bonds').upsert(rows, { onConflict: 'user_id,bond_number', ignoreDuplicates: true }).select();
  if (error) throw error;
  return { added: data?.length ?? 0, skipped: numbers.length - (data?.length ?? 0) };
}

export async function updatePrizeBond(userId: string, id: string, rawNumber: string): Promise<PrizeBond> {
  const bond_number = normalizeBondNumber(rawNumber);
  if (!bond_number) throw new Error('INVALID_BOND_NUMBER');
  const { data, error } = await supabase.from('prize_bonds').update({ bond_number }).eq('id', id).eq('user_id', userId).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('DUPLICATE_BOND');
    throw error;
  }
  return mapBond(data as DbBond);
}

export async function deletePrizeBond(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('prize_bonds').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function triggerPrizeBondCheck(accessToken: string): Promise<{ wins_found: number; bonds_checked: number }> {
  logPrizeBond('check', 'start');
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/prize-bond-check'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'user' }),
    });
  } catch (e) {
    logPrizeBond('check', 'network-error', e);
    throw e;
  }

  const text = await res.text();
  let json: { error?: string; wins_found?: number; bonds_checked?: number };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    logPrizeBond('check', 'invalid-response', { status: res.status, body: text.slice(0, 400) });
    throw new Error('INVALID_API_RESPONSE');
  }

  logPrizeBond('check', 'response', { status: res.status, ...json });
  if (!res.ok) {
    const err = new Error(json.error || 'CHECK_FAILED');
    logPrizeBond('check', 'api-error', err.message);
    throw err;
  }
  return { wins_found: json.wins_found ?? 0, bonds_checked: json.bonds_checked ?? 0 };
}

export async function fetchScanLearnHints(userId: string): Promise<ScanLearnHints> {
  const { data, error } = await supabase
    .from('prize_bond_scan_feedback')
    .select('detected_number, confirmed_number, best_region')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return buildScanLearnHints((data ?? []) as PrizeBondScanFeedback[]);
}

export async function saveScanFeedback(userId: string, feedback: PrizeBondScanFeedback): Promise<void> {
  const { error } = await supabase.from('prize_bond_scan_feedback').insert({
    user_id: userId,
    detected_number: feedback.detected_number,
    confirmed_number: feedback.confirmed_number,
    best_region: feedback.best_region ?? null,
    region_scores: feedback.region_scores ?? null,
  });
  if (error) throw error;
}
