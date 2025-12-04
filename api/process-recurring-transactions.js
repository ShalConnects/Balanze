import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Calculate the next occurrence date based on frequency
 * Handles edge cases like month-end dates properly
 */
function calculateNextOccurrence(currentDate, frequency) {
  const date = new Date(currentDate);
  const originalDay = date.getDate();
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      // Preserve the day of month, handling month-end dates
      date.setMonth(date.getMonth() + 1);
      // If the day doesn't exist in the new month (e.g., Jan 31 -> Feb), adjust to last day of month
      if (date.getDate() !== originalDay) {
        date.setDate(0); // Go to last day of previous month (which is the target month)
      }
      break;
    case 'yearly':
      // Preserve month and day, handling leap years
      const originalMonth = date.getMonth();
      date.setFullYear(date.getFullYear() + 1);
      // Handle Feb 29 -> Feb 28 in non-leap years
      if (originalMonth === 1 && originalDay === 29 && date.getMonth() === 2) {
        date.setDate(0); // Go to last day of February
      }
      break;
    default:
      // Invalid frequency, return current date
      return date.toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a notification for a recurring transaction instance
 */
async function createRecurringTransactionNotification(userId, transaction) {
  try {
    const account = await supabase
      .from('accounts')
      .select('name, currency')
      .eq('id', transaction.account_id)
      .single();

    const accountName = account.data?.name || 'Unknown Account';
    const currency = account.data?.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency;
    const amount = Math.abs(transaction.amount).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

    const title = '🔄 Recurring Transaction Processed';
    const body = `${transaction.description || 'Recurring Transaction'} - ${symbol}${amount} has been processed from ${accountName}`;

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type: transaction.type === 'income' ? 'success' : 'info',
    });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    }
}

/**
 * Process recurring transactions that are due
 */
async function processRecurringTransactions() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all active recurring transactions that are due
    // Query: is_recurring=true, is_paused=false, next_occurrence_date <= today
    // AND (recurring_end_date IS NULL OR recurring_end_date >= today)
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_recurring', true)
      .eq('is_paused', false)
      .lte('next_occurrence_date', today)
      .not('next_occurrence_date', 'is', null) // Ensure next_occurrence_date exists
      .or(`recurring_end_date.is.null,recurring_end_date.gte.${today}`);

    if (fetchError) {
      throw fetchError;
    }

    if (!recurringTransactions || recurringTransactions.length === 0) {
      return { processed: 0, errors: [] };
    }

    const errors = [];
    let processedCount = 0;

    for (const recurringTransaction of recurringTransactions) {
      try {
        // Validate recurring_frequency
        if (!recurringTransaction.recurring_frequency || 
            !['daily', 'weekly', 'monthly', 'yearly'].includes(recurringTransaction.recurring_frequency)) {
          errors.push({
            transactionId: recurringTransaction.id,
            error: `Invalid recurring_frequency: ${recurringTransaction.recurring_frequency}`,
          });
          continue;
        }

        // Validate next_occurrence_date or fallback to transaction date
        const occurrenceDate = recurringTransaction.next_occurrence_date || recurringTransaction.date;
        if (!occurrenceDate) {
          errors.push({
            transactionId: recurringTransaction.id,
            error: 'Missing both next_occurrence_date and date',
          });
          continue;
        }

        // Check if end date has passed
        if (recurringTransaction.recurring_end_date) {
          const endDate = new Date(recurringTransaction.recurring_end_date);
          const todayDate = new Date(today);
          const occurrenceDateObj = new Date(occurrenceDate);
          
          // Skip if end date has passed
          if (endDate < todayDate) {
            // Mark as expired by setting next_occurrence_date to null
            await supabase
              .from('transactions')
              .update({ next_occurrence_date: null })
              .eq('id', recurringTransaction.id);
            continue;
          }
          
          // Skip if occurrence date is after end date
          if (occurrenceDateObj > endDate) {
            // Mark as expired
            await supabase
              .from('transactions')
              .update({ next_occurrence_date: null })
              .eq('id', recurringTransaction.id);
            continue;
          }
        }

        // Validate account exists before processing
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', recurringTransaction.account_id)
          .eq('user_id', recurringTransaction.user_id)
          .single();

        if (accountError || !account) {
          errors.push({
            transactionId: recurringTransaction.id,
            error: `Account not found or inaccessible: ${accountError?.message || 'Account does not exist'}`,
          });
          continue;
        }

        // Check for duplicate processing: Verify no instance already exists for this occurrence date
        const { data: existingInstance } = await supabase
          .from('transactions')
          .select('id')
          .eq('parent_recurring_id', recurringTransaction.id)
          .eq('date', occurrenceDate)
          .limit(1)
          .maybeSingle();

        if (existingInstance) {
          // Instance already exists, update next_occurrence_date and skip
          const nextOccurrenceDate = calculateNextOccurrence(
            occurrenceDate,
            recurringTransaction.recurring_frequency
          );
          await supabase
            .from('transactions')
            .update({ next_occurrence_date: nextOccurrenceDate })
            .eq('id', recurringTransaction.id);
          continue;
        }

        // Calculate next occurrence date
        const nextOccurrenceDate = calculateNextOccurrence(
          occurrenceDate,
          recurringTransaction.recurring_frequency
        );

        // Create new transaction instance
        const newTransaction = {
          user_id: recurringTransaction.user_id,
          account_id: recurringTransaction.account_id,
          type: recurringTransaction.type,
          amount: 0, // Start with 0, user can edit
          description: recurringTransaction.description,
          category: recurringTransaction.category,
          date: occurrenceDate, // Use validated occurrence date
          tags: recurringTransaction.tags || [],
          saving_amount: 0, // Start with 0
          donation_amount: 0, // Start with 0
          is_recurring: false, // Instance is not recurring
          parent_recurring_id: recurringTransaction.id,
          transaction_id: generateTransactionId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert the new transaction
        const { data: createdTransaction, error: insertError } = await supabase
          .from('transactions')
          .insert(newTransaction)
          .select('id, transaction_id')
          .single();

        if (insertError) {
          errors.push({
            transactionId: recurringTransaction.id,
            error: insertError.message,
          });
          continue;
        }

        // Create donation records for income transactions with donations
        if (recurringTransaction.type === 'income' && recurringTransaction.donation_amount && recurringTransaction.donation_amount > 0 && createdTransaction) {
          try {
            // Find the donation record from the parent recurring transaction
            const { data: parentDonationRecords, error: donationFetchError } = await supabase
              .from('donation_saving_records')
              .select('*')
              .eq('transaction_id', recurringTransaction.id)
              .eq('type', 'donation')
              .limit(1)
              .maybeSingle();

            if (!donationFetchError && parentDonationRecords) {
              // Create donation record for the new transaction instance
              const { error: donationInsertError } = await supabase
                .from('donation_saving_records')
                .insert({
                  user_id: recurringTransaction.user_id,
                  transaction_id: createdTransaction.id,
                  custom_transaction_id: createdTransaction.transaction_id,
                  type: 'donation',
                  amount: Math.abs(recurringTransaction.donation_amount),
                  mode: parentDonationRecords.mode || 'fixed',
                  mode_value: parentDonationRecords.mode_value || recurringTransaction.donation_amount,
                  status: 'pending',
                });

              if (donationInsertError) {
                // Log error for monitoring but don't fail the transaction creation
                console.error(`Failed to create donation record for transaction ${createdTransaction.id}:`, donationInsertError);
                // Still track this as a warning in errors array for visibility
                errors.push({
                  transactionId: recurringTransaction.id,
                  error: `Warning: Transaction created but donation record failed: ${donationInsertError.message}`,
                });
              }
            } else if (donationFetchError && donationFetchError.code !== 'PGRST116') {
              // PGRST116 is "not found" which is acceptable (parent might not have donation record)
              // Other errors should be logged
              console.error(`Error fetching parent donation record for transaction ${recurringTransaction.id}:`, donationFetchError);
            }
          } catch (donationError) {
            // Log error but don't fail the transaction creation
            console.error(`Unexpected error creating donation record for transaction ${createdTransaction?.id || recurringTransaction.id}:`, donationError);
            errors.push({
              transactionId: recurringTransaction.id,
              error: `Warning: Unexpected error creating donation record: ${donationError.message || 'Unknown error'}`,
            });
          }
        }

        // Update occurrence count and next occurrence date
        const occurrenceCount = (recurringTransaction.occurrence_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            occurrence_count: occurrenceCount,
            next_occurrence_date: nextOccurrenceDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recurringTransaction.id);

        if (updateError) {
          errors.push({
            transactionId: recurringTransaction.id,
            error: `Failed to update recurring transaction: ${updateError.message}`,
          });
        } else {
          processedCount++;
          
          // Create notification for the user
          await createRecurringTransactionNotification(
            recurringTransaction.user_id,
            recurringTransaction
          );
        }

      } catch (error) {
        errors.push({
          transactionId: recurringTransaction.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    return { processed: processedCount, errors };
  } catch (error) {
    throw error;
  }
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Only allow POST requests (for cron jobs, Vercel sends GET)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional: Add authentication check for security
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // For cron jobs, Vercel adds a special header
      const cronHeader = req.headers['x-vercel-cron'];
      if (!cronHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

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

