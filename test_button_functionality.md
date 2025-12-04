# Test Email Button Functionality

## What the Test Button Does

The new **"Test Email Delivery"** button will:

1. ✅ **Check if recipients exist** - Shows error if no recipients configured
2. ✅ **Simulate overdue status** - Sets `last_check_in` to past date
3. ✅ **Trigger background process** - Calls the API endpoint immediately
4. ✅ **Send test emails** - Processes overdue users and sends emails
5. ✅ **Show results** - Displays success/failure messages
6. ✅ **Reload settings** - Updates the UI to reflect changes

## How to Use the Test Button

### **Step 1: Set Up Test Scenario**
1. Go to Last Wish settings
2. Activate the system control
3. Add at least one recipient (your own email for testing)
4. Set check-in frequency (any value works for testing)

### **Step 2: Click Test Button**
1. Click the **"Test Email Delivery"** button (orange/red button)
2. The system will:
   - Check if recipients exist
   - Simulate overdue status
   - Trigger the background process
   - Send emails immediately

### **Step 3: Check Results**
1. **Success Message**: "Test email sent! Processed X users. Check your email."
2. **Check Your Email**: Look for the Last Wish email
3. **Check Console**: Open browser dev tools to see detailed logs

## What Happens During the Test

### **Before Test:**
- `last_check_in`: Current date
- `is_active`: true
- Status: Not overdue

### **During Test:**
- `last_check_in`: Set to past date (overdue)
- `is_active`: true
- Background process triggered
- Emails sent to recipients

### **After Test:**
- `is_active`: false (prevents duplicate emails)
- Email delivered to recipients
- System shows "delivered" status

## Troubleshooting

### **If Button is Disabled:**
- **No recipients**: Add at least one recipient first
- **System not active**: Activate the system control first

### **If Test Fails:**
- **Check console logs** for detailed error messages
- **Verify SMTP configuration** in Supabase dashboard
- **Check API endpoint** is accessible

### **If No Email Received:**
- **Check spam folder**
- **Verify recipient email address**
- **Check SMTP configuration**
- **Look at server logs**

## Benefits of Test Button

1. **Immediate Testing** - No need to wait days
2. **Recipient Validation** - Checks if recipients exist
3. **Full Flow Testing** - Tests entire email delivery process
4. **Real-time Feedback** - Shows success/failure immediately
5. **Safe Testing** - Uses test data, doesn't affect real users

## Test Button Location

The test button appears:
- **When**: System is enabled AND recipients exist
- **Where**: Below the "Record Activity" button
- **Color**: Orange/red gradient
- **Icon**: Mail icon
- **Text**: "Test Email Delivery"

## Expected Results

### **Successful Test:**
```
✅ Simulated overdue status
✅ Background process result: {success: true, processedCount: 1}
✅ Test email sent! Processed 1 users. Check your email.
```

### **Failed Test:**
```
❌ No recipients configured. Please add recipients first.
❌ Test failed: API returned 500
❌ SMTP configuration error
```

This test button provides a complete end-to-end test of the email delivery system!
