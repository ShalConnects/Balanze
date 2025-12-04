# SMTP Troubleshooting Guide

## Current Issue
- "Error sending confirmation email" with status 500
- SMTP test button missing in Supabase dashboard
- Registration fails even with correct SMTP settings

## Step-by-Step Solutions

### 1. Check Supabase Project Settings

**Go to:** Supabase Dashboard → Settings → General

**Verify:**
- Project is on a paid plan (SMTP requires paid plan)
- Email service is enabled
- No project-wide email restrictions

### 2. Alternative SMTP Providers

If Gmail SMTP continues to fail, try these alternatives:

#### Option A: Use SendGrid (Recommended)
1. Sign up for free SendGrid account
2. Create API key
3. In Supabase Dashboard → Authentication → Email → SMTP Settings:
   - **SMTP Host:** `smtp.sendgrid.net`
   - **Port:** `587`
   - **Username:** `apikey`
   - **Password:** Your SendGrid API key
   - **Sender Email:** Your verified sender email
   - **Sender Name:** Your preferred name

#### Option B: Use Mailgun
1. Sign up for free Mailgun account
2. In Supabase Dashboard → Authentication → Email → SMTP Settings:
   - **SMTP Host:** `smtp.mailgun.org`
   - **Port:** `587`
   - **Username:** Your Mailgun username
   - **Password:** Your Mailgun password
   - **Sender Email:** Your verified domain email

#### Option C: Use Resend
1. Sign up for free Resend account
2. In Supabase Dashboard → Authentication → Email → SMTP Settings:
   - **SMTP Host:** `smtp.resend.com`
   - **Port:** `587`
   - **Username:** `resend`
   - **Password:** Your Resend API key
   - **Sender Email:** Your verified domain email

### 3. Check Gmail Security Settings

If using Gmail SMTP:

1. **Go to:** https://myaccount.google.com/security
2. **Enable 2-Step Verification** if not already enabled
3. **Generate App Password:**
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Supabase" as the name
   - Copy the generated 16-character password
4. **Use this app password** in your Supabase SMTP settings

### 4. Verify Gmail SMTP Settings

In Supabase Dashboard → Authentication → Email → SMTP Settings:

```
SMTP Host: smtp.gmail.com
Port: 587 (TLS) or 465 (SSL)
Username: your.email@gmail.com
Password: [Your 16-character app password]
Sender Email: your.email@gmail.com
Sender Name: Your Name
Minimum Interval: 60
```

### 5. Check for Rate Limiting

If you've sent many emails recently:
- Wait 60-90 minutes before trying again
- Check Gmail's sending limits (500/day for regular accounts)
- Consider using a different Gmail account

### 6. Alternative: Disable Email Confirmation Temporarily

For immediate testing, you can temporarily disable email confirmation:

1. **Go to:** Supabase Dashboard → Authentication → Settings
2. **Disable:** "Enable email confirmations"
3. **Save changes**
4. **Test registration** - users should be able to log in immediately
5. **Re-enable** email confirmations once SMTP is working

### 7. Check Supabase Logs

**Go to:** Supabase Dashboard → Authentication → Logs

Look for:
- Email sending errors
- Rate limit messages
- SMTP connection failures

### 8. Contact Supabase Support

If all else fails:
1. Go to Supabase Dashboard → Support
2. Create a ticket with:
   - Your project URL
   - Error messages from logs
   - SMTP configuration details (without passwords)

## Quick Test

Run this command to test your current setup:
```bash
node test_email_detailed.js
```

## Immediate Workaround

The app has been updated with a development bypass that allows immediate login on Vercel and localhost. Users can register and log in immediately while you fix the SMTP issues.

## Next Steps

1. Try a different SMTP provider (SendGrid recommended)
2. Check your Supabase project plan and settings
3. Temporarily disable email confirmation for testing
4. Contact Supabase support if issues persist 