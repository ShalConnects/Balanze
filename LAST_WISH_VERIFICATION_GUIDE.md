# Last Wish System Verification Guide

## 🎯 **How to Verify the Email Delivery System Will Work**

The Last Wish system is designed to automatically send emails when users don't check in within their specified timeframe. Here's how to verify it will work:

## 🔧 **System Components Status**

### ✅ **What's Already Built & Working:**

1. **Database Functions** ✅
   - `check_overdue_last_wish()` - Identifies overdue users
   - `trigger_last_wish_delivery()` - Creates delivery records
   - All tables and triggers are set up

2. **Email Service Logic** ✅
   - Complete email delivery system in `last-wish-service.js`
   - Data gathering from all tables
   - Email template generation
   - SMTP configuration

3. **Frontend Integration** ✅
   - User settings management
   - Check-in functionality
   - Countdown widget

### ❌ **What Needs to be Set Up:**

**The Missing Piece: Automated Execution**

The system currently only runs when manually executed. To make it work automatically, you need to set up one of these options:

## 🚀 **Option 1: Vercel Cron Jobs (Recommended)**

### **Step 1: Set Environment Variables**
Add these to your Vercel project:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Step 2: Deploy with Cron Job**
The `vercel.json` file is already configured with:
```json
{
  "crons": [
    {
      "path": "/api/last-wish-check",
      "schedule": "0 * * * *"
    }
  ]
}
```

This will run the service **every hour**.

### **Step 3: Test the System**
```bash
# Deploy to Vercel
vercel --prod

# Test the API endpoint manually
curl -X POST https://your-app.vercel.app/api/last-wish-check
```

## 🖥️ **Option 2: Local Cron Job**

### **Step 1: Set up the service**
```bash
# Make the setup script executable
chmod +x setup-last-wish-cron.sh

# Run the setup
./setup-last-wish-cron.sh
```

### **Step 2: Configure environment**
Edit the `.env` file with your credentials:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Step 3: Test manually**
```bash
# Test the service
node last-wish-service.js
```

## 🧪 **How to Test the System**

### **Test 1: Create a Test User**
```sql
-- Create test settings with 1-day frequency
INSERT INTO last_wish_settings (
  user_id,
  is_enabled,
  check_in_frequency,
  last_check_in,
  recipients,
  include_data,
  message,
  is_active
) VALUES (
  'your-test-user-id',
  true,
  1, -- 1 day frequency for quick testing
  NOW() - INTERVAL '2 days', -- 2 days ago (overdue)
  '[{"email": "test@example.com", "name": "Test", "relationship": "Family"}]',
  '{"accounts": true, "transactions": true, "purchases": true, "lendBorrow": true, "savings": true, "analytics": true}',
  'Test message for verification',
  true
);
```

### **Test 2: Run the Service**
```bash
# Option A: Test via Vercel API
curl -X POST https://your-app.vercel.app/api/last-wish-check

# Option B: Test locally
node last-wish-service.js
```

### **Test 3: Check Results**
```sql
-- Check if user was processed
SELECT * FROM last_wish_settings WHERE user_id = 'your-test-user-id';

-- Check delivery logs
SELECT * FROM last_wish_deliveries WHERE user_id = 'your-test-user-id';
```

## 📊 **Monitoring & Verification**

### **Real-time Monitoring**
```bash
# View service logs
tail -f last-wish-logs.txt

# Check Vercel function logs
vercel logs --follow
```

### **Database Monitoring**
```sql
-- Check active users
SELECT COUNT(*) FROM last_wish_settings WHERE is_enabled = TRUE;

-- Check overdue users
SELECT * FROM check_overdue_last_wish();

-- Check delivery status
SELECT delivery_status, COUNT(*) 
FROM last_wish_deliveries 
GROUP BY delivery_status;
```

## 🔍 **What Happens When Check-in Time Expires**

1. **Detection**: The cron job runs every hour and calls `check_overdue_last_wish()`
2. **Identification**: Finds users where `NOW() > (last_check_in + check_in_frequency days)`
3. **Data Gathering**: Collects all user data (accounts, transactions, purchases, etc.)
4. **Email Delivery**: Sends formatted emails with JSON attachments to all recipients
5. **Status Update**: Marks the user as `is_active = false` to prevent duplicate deliveries
6. **Logging**: Records all activities in `last_wish_deliveries` table

## ⚠️ **Important Notes**

### **Email Configuration**
- Use Gmail App Passwords (not regular passwords)
- Enable 2FA on your Gmail account
- Use port 587 for SMTP

### **Security**
- The service uses Supabase service key (not anon key)
- All data is encrypted in transit
- Recipients receive only the data you specify

### **Reliability**
- The system has fallback mechanisms if the RPC function fails
- Failed deliveries are logged and can be retried
- The service is idempotent (safe to run multiple times)

## 🎯 **Verification Checklist**

- [ ] Environment variables configured
- [ ] Email credentials tested
- [ ] Database functions working
- [ ] Test user created with short frequency
- [ ] Service runs without errors
- [ ] Emails are delivered
- [ ] Delivery logs are created
- [ ] Cron job is scheduled
- [ ] Monitoring is set up

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Service test failed"**
   - Check environment variables
   - Verify Supabase connection
   - Test email credentials

2. **"No overdue users found"**
   - Check if test user is properly configured
   - Verify `is_enabled = true` and `is_active = true`
   - Check if `last_check_in` is old enough

3. **"Email sending failed"**
   - Verify SMTP credentials
   - Check Gmail App Password
   - Test email configuration

4. **"Cron job not running"**
   - Check crontab: `crontab -l`
   - Verify cron service: `systemctl status cron`
   - Check logs: `tail -f last-wish-logs.txt`

## 📞 **Support**

If you encounter issues:
1. Check the logs first
2. Verify all environment variables
3. Test each component individually
4. Use the test user method above

The system is designed to be reliable and will work once properly configured! 