/** Active business investment contracts + entries (closed excluded for Last Wish). */
export async function fetchActiveBusinessContractsWithEntries(supabase, userId) {
  const { data: contracts, error: cErr } = await supabase
    .from('business_investment_contracts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (cErr) throw cErr;
  const list = contracts || [];
  if (list.length === 0) return [];

  const ids = list.map((c) => c.id);
  const { data: entryRows, error: eErr } = await supabase
    .from('business_investment_entries')
    .select('*')
    .in('contract_id', ids)
    .order('date', { ascending: false });

  if (eErr) throw eErr;
  const byContract = {};
  for (const e of entryRows || []) {
    (byContract[e.contract_id] ||= []).push(e);
  }
  return list.map((c) => ({ ...c, entries: byContract[c.id] || [] }));
}
