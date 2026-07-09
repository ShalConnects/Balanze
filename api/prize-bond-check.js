import { supabase } from '../lib/supabaseServer.js';
import { checkBondsWithPbris, chunkArray } from '../lib/pbrisClient.js';
import { isPrizeBondDrawDay, PRIZE_BOND_BATCH_SIZE, parsePbrisDrawDate } from '../lib/prizeBondShared.js';

const BATCH_SIZE = PRIZE_BOND_BATCH_SIZE;

async function resolveUserId(req) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  const isCron = req.headers['x-vercel-cron'];

  if (isCron || (cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    return { mode: 'cron', userId: null };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { mode: 'user', userId: data.user.id };
}

async function notifyWin(userId, win) {
  const title = `🎉 Prize Bond Win: ${win.bond_number}`;
  const body = `${win.prize_tier} — ৳${Number(win.prize_amount).toLocaleString()} (Draw: ${win.draw_date})`;
  await supabase.from('notifications').insert({ user_id: userId, title, body, type: 'success' });
}

async function storeWins(userId, bondsByNumber, wins) {
  let newWins = 0;
  for (const win of wins) {
    const bond = bondsByNumber.get(win.bond_number);
    if (!bond) continue;
    const draw_date = parsePbrisDrawDate(win.draw_date);
    if (!draw_date) continue;

    const { data, error } = await supabase.from('prize_bond_wins').insert({
      user_id: userId,
      bond_id: bond.id,
      bond_number: win.bond_number,
      prize_tier: win.prize_tier,
      prize_amount: win.prize_amount,
      draw_date,
      series: win.series || null,
      notified_at: new Date().toISOString(),
    }).select();

    if (error) {
      if (error.code === '23505') continue;
      console.error('[prize-bond-check] insert error', error);
      continue;
    }
    if (data?.length) {
      newWins++;
      await notifyWin(userId, win);
    }
  }
  return newWins;
}

async function checkUserBonds(userId) {
  const { data: bonds, error } = await supabase.from('prize_bonds').select('id, bond_number').eq('user_id', userId);
  if (error) throw error;
  if (!bonds?.length) return { bonds_checked: 0, wins_found: 0 };

  const bondsByNumber = new Map(bonds.map((b) => [b.bond_number, b]));
  const numbers = bonds.map((b) => b.bond_number);
  let winsFound = 0;

  for (const batch of chunkArray(numbers, BATCH_SIZE)) {
    const wins = await checkBondsWithPbris(batch);
    winsFound += await storeWins(userId, bondsByNumber, wins);
    await new Promise((r) => setTimeout(r, 1200));
  }

  return { bonds_checked: numbers.length, wins_found: winsFound };
}

async function checkAllUsers() {
  const { data: users, error } = await supabase.from('prize_bonds').select('user_id');
  if (error) throw error;
  const userIds = [...new Set((users || []).map((u) => u.user_id))];
  let totalWins = 0;
  let totalBonds = 0;

  for (const userId of userIds) {
    try {
      const result = await checkUserBonds(userId);
      totalWins += result.wins_found;
      totalBonds += result.bonds_checked;
    } catch (e) {
      console.error(`[prize-bond-check] user ${userId}`, e);
    }
  }
  return { users_checked: userIds.length, bonds_checked: totalBonds, wins_found: totalWins };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabase) {
    console.error('[prize-bond-check] Supabase not configured (SUPABASE_URL + SUPABASE_SERVICE_KEY)');
    return res.status(503).json({ error: 'Server configuration error' });
  }

  const auth = await resolveUserId(req);
  if (!auth) {
    console.error('[prize-bond-check] Unauthorized', { hasAuthHeader: !!(req.headers.authorization) });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (auth.mode === 'user') {
      console.log('[prize-bond-check] user check', auth.userId);
      const result = await checkUserBonds(auth.userId);
      console.log('[prize-bond-check] user result', result);
      return res.status(200).json({ success: true, ...result });
    }
    if (!isPrizeBondDrawDay()) {
      return res.status(200).json({ success: true, skipped: true, reason: 'not_draw_day' });
    }
    const result = await checkAllUsers();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[prize-bond-check]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
