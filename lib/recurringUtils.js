/** Shared recurring transaction utilities (API + frontend) */

export function toYyyyMmDd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString).split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayYyyyMmDd() {
  return toYyyyMmDd(new Date());
}

export function calculateNextOccurrence(currentDate, frequency) {
  const date = parseLocalDate(currentDate);
  const originalDay = date.getDate();
  switch (frequency) {
    case 'daily': date.setDate(date.getDate() + 1); break;
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      if (date.getDate() !== originalDay) date.setDate(0);
      break;
    case 'yearly': {
      const originalMonth = date.getMonth();
      date.setFullYear(date.getFullYear() + 1);
      if (originalMonth === 1 && originalDay === 29 && date.getMonth() === 2) date.setDate(0);
      break;
    }
    default: return toYyyyMmDd(date);
  }
  return toYyyyMmDd(date);
}

/** Advance until strictly after `afterDate` (inclusive backlog skip). */
export function calculateNextOccurrenceAfter(currentDate, frequency, afterDate) {
  let next = calculateNextOccurrence(currentDate, frequency);
  const limit = parseLocalDate(afterDate);
  for (let i = 0; i < 400 && parseLocalDate(next) <= limit; i++) {
    next = calculateNextOccurrence(next, frequency);
  }
  return next;
}

/** Due occurrence dates from start through `throughDate`, respecting optional end date. */
export function dueOccurrenceDates(startDate, frequency, throughDate, endDate = null, max = 366) {
  const dates = [];
  let d = startDate;
  const through = parseLocalDate(throughDate);
  const end = endDate ? parseLocalDate(endDate) : null;
  for (let i = 0; i < max; i++) {
    const cur = parseLocalDate(d);
    if (cur > through || (end && cur > end)) break;
    dates.push(d);
    d = calculateNextOccurrence(d, frequency);
  }
  return { dates, nextAfter: d };
}

export function buildRecurringInstance(parent, occurrenceDate, transactionId, timestamps = {}) {
  const now = new Date().toISOString();
  return {
    user_id: parent.user_id,
    account_id: parent.account_id,
    type: parent.type,
    amount: parent.amount ?? 0,
    description: parent.description,
    category: parent.category,
    date: occurrenceDate,
    tags: parent.tags || [],
    saving_amount: parent.saving_amount ?? 0,
    donation_amount: 0,
    is_recurring: false,
    parent_recurring_id: parent.id,
    transaction_id: transactionId,
    ...(parent.to_account_id && { to_account_id: parent.to_account_id }),
    created_at: timestamps.created_at || now,
    updated_at: timestamps.updated_at || now,
  };
}

/** Copy donation template from parent recurring tx onto a child instance. */
export async function cloneParentDonation(supabase, parent, child) {
  if (parent.type !== 'income' || !(Number(parent.donation_amount) > 0)) return { ok: true };
  const { data: parentDonation, error: fetchError } = await supabase
    .from('donation_saving_records')
    .select('mode, mode_value')
    .eq('transaction_id', parent.id)
    .eq('type', 'donation')
    .limit(1)
    .maybeSingle();
  if (fetchError && fetchError.code !== 'PGRST116') return { ok: false, error: fetchError };

  const { error } = await supabase.from('donation_saving_records').insert({
    user_id: parent.user_id,
    transaction_id: child.id,
    custom_transaction_id: child.transaction_id,
    type: 'donation',
    amount: Math.abs(parent.donation_amount),
    mode: parentDonation?.mode || 'fixed',
    mode_value: parentDonation?.mode_value || parent.donation_amount,
    status: 'pending',
  });
  return error ? { ok: false, error } : { ok: true };
}

export function getUpcomingOccurrences(startDate, frequency, endDate = null, count = 5) {
  const results = [];
  let d = startDate;
  const end = endDate ? parseLocalDate(endDate) : null;
  for (let i = 0; i < count; i++) {
    if (end && parseLocalDate(d) > end) break;
    results.push(d);
    d = calculateNextOccurrence(d, frequency);
  }
  return results;
}
