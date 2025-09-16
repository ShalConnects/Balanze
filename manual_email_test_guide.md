# Manual Email Delivery Test Guide

## How to Test if Emails Will Be Delivered

### Method 1: Quick Test (Recommended)

1. **Set up a test scenario:**
   - Go to Last Wish settings
   - Activate the system control
   - Add a recipient with your own email address
   - Set check-in frequency to 7 days (shortest option)
   - Record activity (click "Record Activity" button)

2. **Wait and test:**
   - Wait 8 days (or modify the database to simulate this)
   - Check if you receive an email

### Method 2: Database Simulation Test

1. **Create test settings:**
   ```sql
   -- Insert test settings with immediate overdue status
   INSERT INTO last_wish_settings (
       user_id,
       is_enabled,
       is_active,
       check_in_frequency,
       last_check_in,
       recipients,
       include_data,
       message
   ) VALUES (
       'your-user-id-here',
       true,
       true,
       30,
       NOW() - INTERVAL '35 days', -- 35 days ago (overdue)
       '[{"id":"1","email":"your-email@example.com","name":"Test","relationship":"friend"}]',
       '{"accounts":true,"transactions":true,"purchases":true,"lendBorrow":true,"savings":true,"analytics":true}',
       'Test message for email delivery'
   );
   ```

2. **Trigger the background process:**
   - Call the API endpoint: `GET /api/last-wish-public`
   - Or run the background process manually

3. **Check results:**
   - Check if email was sent
   - Check if `is_active` was set to `false`
   - Check if delivery record was created

### Method 3: Check Background Process Status

1. **Verify the background process is running:**
   - Check if you have a cron job or scheduled task running
   - Verify the API endpoints are accessible
   - Check server logs for background process activity

2. **Test the API endpoints:**
   ```bash
   # Test the public endpoint
   curl -X GET "https://your-domain.com/api/last-wish-public"
   
   # Test the check endpoint (if it exists)
   curl -X GET "https://your-domain.com/api/last-wish-check"
   ```

### Method 4: Environment Variables Check

Make sure these environment variables are set:
- `SMTP_HOST` - Your SMTP server
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_USER` - Your email username
- `SMTP_PASS` - Your email password

### What to Look For

✅ **Success indicators:**
- Email is received at the specified address
- `is_active` is set to `false` after delivery
- Delivery record is created in `last_wish_deliveries` table
- No errors in server logs

❌ **Failure indicators:**
- No email received
- `is_active` remains `true` after overdue period
- Error messages in server logs
- API endpoints return errors

### Troubleshooting

If emails are not being delivered:

1. **Check SMTP configuration:**
   - Verify email credentials
   - Test SMTP connection
   - Check firewall/network settings

2. **Check background process:**
   - Verify cron job is running
   - Check API endpoint accessibility
   - Review server logs

3. **Check database:**
   - Verify `last_wish_deliveries` table exists
   - Check if delivery records are being created
   - Verify RLS policies allow background process access

### Quick Verification Commands

```sql
-- Check if any users are overdue
SELECT * FROM check_overdue_last_wish();

-- Check recent delivery records
SELECT * FROM last_wish_deliveries ORDER BY created_at DESC LIMIT 10;

-- Check current settings
SELECT user_id, is_enabled, is_active, last_check_in, check_in_frequency 
FROM last_wish_settings 
WHERE is_enabled = true;
```
