# SendGrid SMTP Setup Guide

## Step 1: Create SendGrid Account

1. **Go to:** https://sendgrid.com/
2. **Click "Start for Free"**
3. **Sign up** with your email
4. **Verify your email** address
5. **Complete account setup**

## Step 2: Verify Your Sender Email

1. **Go to:** SendGrid Dashboard → Settings → Sender Authentication
2. **Click "Verify a Single Sender"**
3. **Fill in the form:**
   - From Name: Your Name
   - From Email: your-email@yourdomain.com (or your Gmail)
   - Company: Your Company Name
   - Address: Your Address
   - City: Your City
   - Country: Your Country
4. **Click "Create"**
5. **Check your email** and click the verification link

## Step 3: Create API Key

1. **Go to:** SendGrid Dashboard → Settings → API Keys
2. **Click "Create API Key"**
3. **Name:** "Supabase SMTP"
4. **Permissions:** Select "Full Access" or "Restricted Access" → "Mail Send"
5. **Click "Create & View"**
6. **Copy the API key** (you'll only see it once!)

## Step 4: Configure Supabase SMTP

1. **Go to:** Supabase Dashboard → Authentication → Email → SMTP Settings
2. **Fill in the settings:**

```
SMTP Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
Sender Email: [Your verified sender email]
Sender Name: [Your preferred name]
Minimum Interval: 60
```

3. **Click "Save"**

## Step 5: Test the Configuration

1. **Go to:** Supabase Dashboard → Authentication → Email → SMTP Settings
2. **Click "Test SMTP"** (if available)
3. **Or test via your app:** Try registering a new user

## Step 6: Alternative - Use Your Gmail with App Password

If you prefer to stick with Gmail:

### Create Gmail App Password:

1. **Go to:** https://myaccount.google.com/security
2. **Enable 2-Step Verification** (if not already enabled)
3. **Go to:** Security → 2-Step Verification → App passwords
4. **Select:** "Mail" and "Other (Custom name)"
5. **Enter:** "Supabase" as the name
6. **Copy the 16-character password**

### Update Supabase SMTP Settings:

```
SMTP Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [Your 16-character app password]
Sender Email: your-email@gmail.com
Sender Name: Your Name
Minimum Interval: 60
```

## Step 7: Test Registration

1. **Go to your app:** https://balanze.cash
2. **Try registering** a new user
3. **Check your email** for confirmation
4. **Click the confirmation link**

## Troubleshooting

### If SendGrid doesn't work:
- Check that your sender email is verified
- Ensure API key has "Mail Send" permissions
- Try using a different sender email

### If Gmail doesn't work:
- Verify 2-Step Verification is enabled
- Use the app password, not your regular password
- Check Gmail's sending limits (500/day)
- Try a different Gmail account

### If still having issues:
- Check Supabase project plan (SMTP might require paid plan)
- Contact Supabase support
- Temporarily disable email confirmation for testing

## Quick Test Command

Run this to test your setup:
```bash
node test_email_detailed.js
```

## Next Steps

1. Follow the steps above
2. Test registration on your app
3. Let me know if you need help with any step
4. Once working, we can re-enable email confirmation 