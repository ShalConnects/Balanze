import { supabase } from '../lib/supabaseServer.js';
import { isCronAuthorized } from '../lib/cronAuth.js';
import {
  todayYyyyMmDd,
  parseLocalDate,
  dueOccurrenceDates,
  buildRecurringInstance,
  cloneParentDonation,
} from '../lib/recurringUtils.js';

const VALID_FREQ = ['daily', 'weekly', 'monthly', 'yearly'];

function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TR-${timestamp}-${random}`.toUpperCase();
}

async function createRecurringTransactionNotification(userId, transaction, count = 1) {
  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('name, currency')
      .eq('id', transaction.account_id)
      .single();

    const currency = account?.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency;
    const amount = Math.abs(transaction.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const suffix = count > 1 ? ` (${count} occurrences)` : '';

    await supabase.from('notifications').insert({
      user_id: userId,
      title: '🔄 Recurring Transaction Processed',
      body: `${transaction.description || 'Recurring Transaction'} - ${symbol}${amount} has been processed from ${account?.name || 'Unknown Account'}${suffix}`,
      type: transaction.type === 'income' ? 'success' : 'info',
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

async function processRecurringTransactions() {
  const today = todayYyyyMmDd();
  const todayDate = parseLocalDate(today);

  const { data: recurringTransactions, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('is_recurring', true)
    .eq('is_paused', false)
    .lte('next_occurrence_date', today)
    .not('next_occurrence_date', 'is', null)
    .or(`recurring_end_date.is.null,recurring_end_date.gte.${today}`);

  if (fetchError) throw fetchError;
  if (!recurringTransactions?.length) return { processed: 0, errors: [] };

  const errors = [];
  let processedCount = 0;

  for (const parent of recurringTransactions) {
    const createdIds = [];
    try {
      if (!VALID_FREQ.includes(parent.recurring_frequency)) {
        errors.push({ transactionId: parent.id, error: `Invalid recurring_frequency: ${parent.recurring_frequency}` });
        continue;
      }

      const startDate = parent.next_occurrence_date || parent.date;
      if (!startDate) {
        errors.push({ transactionId: parent.id, error: 'Missing both next_occurrence_date and date' });
        continue;
      }

      if (parent.recurring_end_date && parseLocalDate(parent.recurring_end_date) < todayDate) {
        await supabase.from('transactions').update({ next_occurrence_date: null }).eq('id', parent.id);
        continue;
      }

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', parent.account_id)
        .eq('user_id', parent.user_id)
        .single();

      if (accountError || !account) {
        errors.push({
          transactionId: parent.id,
          error: `Account not found or inaccessible: ${accountError?.message || 'Account does not exist'}`,
        });
        continue;
      }

      const { dates, nextAfter } = dueOccurrenceDates(
        startDate,
        parent.recurring_frequency,
        today,
        parent.recurring_end_date
      );

      if (!dates.length) {
        await supabase
          .from('transactions')
          .update({ next_occurrence_date: null, updated_at: new Date().toISOString() })
          .eq('id', parent.id);
        continue;
      }

      let created = 0;
      for (const occurrenceDate of dates) {
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('parent_recurring_id', parent.id)
          .eq('date', occurrenceDate)
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        const { data: inserted, error: insertError } = await supabase
          .from('transactions')
          .insert(buildRecurringInstance(parent, occurrenceDate, generateTransactionId()))
          .select('id, transaction_id')
          .single();

        if (insertError) {
          errors.push({ transactionId: parent.id, error: insertError.message });
          continue;
        }

        createdIds.push(inserted.id);
        const donation = await cloneParentDonation(supabase, parent, inserted);
        if (!donation.ok) {
          errors.push({
            transactionId: parent.id,
            error: `Warning: Transaction created but donation record failed: ${donation.error?.message || 'unknown'}`,
          });
        }
        created++;
      }

      const pastEnd =
        parent.recurring_end_date && parseLocalDate(nextAfter) > parseLocalDate(parent.recurring_end_date);
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          occurrence_count: (parent.occurrence_count || 0) + created,
          next_occurrence_date: pastEnd ? null : nextAfter,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parent.id);

      if (updateError) {
        if (createdIds.length) {
          await supabase.from('donation_saving_records').delete().in('transaction_id', createdIds);
          await supabase.from('transactions').delete().in('id', createdIds);
        }
        errors.push({
          transactionId: parent.id,
          error: `Failed to update recurring transaction: ${updateError.message}`,
        });
        continue;
      }

      if (created > 0) {
        processedCount += created;
        await createRecurringTransactionNotification(parent.user_id, parent, created);
      }
    } catch (error) {
      if (createdIds.length) {
        try {
          await supabase.from('donation_saving_records').delete().in('transaction_id', createdIds);
          await supabase.from('transactions').delete().in('id', createdIds);
        } catch (cleanupError) {
          console.error('Error during cleanup of orphaned transactions:', cleanupError);
        }
      }
      errors.push({ transactionId: parent.id, error: error.message || 'Unknown error' });
    }
  }

  return { processed: processedCount, errors };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Server configuration error' });
  }
  try {
    const result = await processRecurringTransactions();
    return res.status(200).json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      message: `Processed ${result.processed} recurring transaction(s)`,
    });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
