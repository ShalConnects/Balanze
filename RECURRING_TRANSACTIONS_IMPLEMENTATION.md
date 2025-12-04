# Recurring Transactions Implementation Guide

## ✅ Implementation Complete

### What's Been Built

1. **Database Schema** (`add_recurring_tracking_columns.sql`)
   - Optional tracking columns added to transactions table
   - All columns are nullable - safe for existing data
   - Indexes created for efficient querying

2. **Transaction Form Enhancement**
   - Recurring checkbox enabled
   - Frequency selector (daily/weekly/monthly/yearly)
   - Optional end date picker
   - Auto-calculates next occurrence date

3. **Recurring Transactions Management Page**
   - Full CRUD operations (Create, Read, Update, Delete)
   - Pause/Resume functionality
   - Search and filters (status, type)
   - Expandable transaction details
   - Route: `/recurring-transactions`

4. **Automated Processing API** (`api/process-recurring-transactions.js`)
   - Processes due recurring transactions hourly
   - Creates new transaction instances
   - Updates occurrence counts
   - **Creates bell notifications** when transactions are processed

5. **Scheduled Job**
   - Configured in `vercel.json`
   - Runs every hour (`0 * * * *`)
   - Processes all due recurring transactions

## 🔔 Notification System

### How Notifications Work

When a recurring transaction is processed:
1. **Notification Created**: A notification is automatically created in the database
   - **Title**: "🔄 Recurring Transaction Processed"
   - **Body**: Transaction details with amount and account name
   - **Type**: 'success' for income, 'info' for expenses

2. **Bell Icon**: Notification appears in the header bell icon
   - Shows unread count badge
   - Click to view all notifications

3. **Notification Dropdown**: Users see notifications with:
   - Transaction description
   - Amount and account
   - Time stamp ("Just now", "5m ago", etc.)
   - Visual styling based on transaction type

### Notification Example

```
🔄 Recurring Transaction Processed
Monthly Rent - $1,500.00 has been processed from Checking Account
```

## 🚀 Setup Instructions

### 1. Run Database Migration

Execute the SQL script in your Supabase SQL Editor:
```sql
-- Run: add_recurring_tracking_columns.sql
```

### 2. Environment Variables

Ensure these are set in Vercel (or your hosting environment):
- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Optional (for cron security):
- `CRON_SECRET` - Set a secret key for cron authentication

### 3. Deploy to Vercel

The cron job is automatically configured in `vercel.json`:
```json
{
  "path": "/api/process-recurring-transactions",
  "schedule": "0 * * * *"  // Every hour
}
```

After deployment, Vercel will automatically run the cron job.

### 4. Test the API (Optional)

You can manually test the endpoint:
```bash
# With cron secret (if set)
curl -X POST https://your-app.vercel.app/api/process-recurring-transactions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Or with Vercel cron header (for testing)
curl -X GET https://your-app.vercel.app/api/process-recurring-transactions \
  -H "x-vercel-cron: 1"
```

## 📋 How It Works

### Creating a Recurring Transaction

1. Open Transaction Form (from Transactions page)
2. Fill in transaction details
3. Check "Recurring Transaction" checkbox
4. Select frequency (daily/weekly/monthly/yearly)
5. Optionally set end date
6. Save transaction

The system automatically:
- Sets `is_recurring = true`
- Calculates `next_occurrence_date`
- Sets `occurrence_count = 0`

### Automatic Processing

Every hour, the cron job:
1. Finds all active recurring transactions where:
   - `is_recurring = true`
   - `is_paused = false`
   - `next_occurrence_date <= today`
   - End date hasn't passed (if set)

2. For each due transaction:
   - Creates a new transaction instance
   - Links to parent via `parent_recurring_id`
   - Updates occurrence count
   - Calculates next occurrence date
   - **Creates a bell notification**

3. Notifications appear in:
   - Header bell icon (with unread badge)
   - Notification dropdown

### Managing Recurring Transactions

Access via:
- Direct route: `/recurring-transactions`
- Or add navigation link in sidebar (optional)

Features:
- **Pause**: Temporarily stop processing
- **Resume**: Restart paused transactions
- **Edit**: Modify recurring transaction details
- **Delete**: Remove recurring transaction (stops all future instances)

## 🔄 Transaction Instance Flow

```
Parent Recurring Transaction (is_recurring = true)
    ↓
    ├─→ Instance 1 (is_recurring = false, parent_recurring_id = parent.id)
    ├─→ Instance 2 (is_recurring = false, parent_recurring_id = parent.id)
    ├─→ Instance 3 (is_recurring = false, parent_recurring_id = parent.id)
    └─→ ...
```

Each instance:
- Is a regular transaction (affects account balance)
- Links back to parent via `parent_recurring_id`
- Appears in transactions list
- Can be edited/deleted independently

## 📊 Tracking

Each recurring transaction tracks:
- `occurrence_count`: Number of times processed
- `next_occurrence_date`: Next scheduled date
- `recurring_end_date`: Optional end date
- `is_paused`: Whether currently paused

## 🛡️ Safety Features

- **Idempotent**: Safe to run multiple times
- **Error Handling**: Failed transactions don't stop processing of others
- **End Date Protection**: Transactions stop after end date
- **Pause Protection**: Paused transactions are skipped

## 🎨 UI Features

- Consistent with site theme
- Dark mode support
- Responsive design
- Loading states
- Empty states
- Error handling

## 🔍 Monitoring

Check recurring transaction processing:
1. View Recurring Transactions page
2. Check occurrence counts (should increment)
3. Check notifications (bell icon) for processed transactions
4. View transaction history for created instances

## 📝 Notes

- **Frequency Calculation**: Based on transaction date, not creation date
- **Timezone**: Uses UTC for date comparisons
- **Account Balance**: Instances automatically update account balances
- **Notifications**: Respect user notification preferences if configured

## 🐛 Troubleshooting

### Notifications Not Appearing
- Check Supabase notifications table has RLS policies
- Verify API endpoint is creating notifications successfully
- Check browser notification permissions

### Transactions Not Processing
- Verify cron job is running (check Vercel logs)
- Check `next_occurrence_date` is set correctly
- Ensure `is_paused = false`
- Verify end date hasn't passed

### API Errors
- Check Supabase service key is correct
- Verify environment variables are set
- Check Vercel function logs for errors

## ✨ Future Enhancements (Optional)

- Recurring transaction templates
- Bulk pause/resume
- Recurring transaction analytics
- Custom frequency options (bi-weekly, quarterly)
- Notification preferences for recurring transactions
- Preview upcoming occurrences

