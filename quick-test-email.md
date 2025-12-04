# Quick Test Email Guide

## 📧 Send Test Email Now

Run this command and follow the prompts:

```bash
node send-test-email-simple.js
```

## 📋 Information You'll Need:

### 1. Choose Option 1 (Manual Entry)

### 2. Provide These Values:

**Supabase URL:**
```
https://xgncksougafnfbtusfnf.supabase.co
```

**Supabase Service Key:**
- Go to: https://supabase.com/dashboard/project/xgncksougafnfbtusfnf/settings/api
- Copy the `service_role` secret key
- Paste it when prompted

**SMTP Host:**
```
smtp.gmail.com
```
(Just press Enter to use default)

**SMTP Port:**
```
587
```
(Just press Enter to use default)

**SMTP User:**
```
salauddin.kader406@gmail.com
```
(Or your Gmail address)

**SMTP Password:**
- This is your Gmail App Password (16 characters)
- If you don't have one, follow these steps:
  1. Go to https://myaccount.google.com/security
  2. Enable 2-Step Verification (if not already enabled)
  3. Go to App Passwords
  4. Generate a new app password for "Mail"
  5. Copy the 16-character password (format: `abcd efgh ijkl mnop`)
  6. Paste it when prompted (spaces don't matter)

## ✅ What Will Happen:

1. Script will find user `salauddin.kader406@gmail.com`
2. Set up test configuration
3. Send email to `salauddin.kader405@gmail.com`
4. Email will include:
   - ✨ New beautiful design with green gradient
   - 👤 Personal greeting with recipient name
   - 📎 Both JSON and PDF attachments
   - 💚 Compassionate, warm tone

## 🎉 After Running:

Check your email at `salauddin.kader405@gmail.com` for the test email!

---

**Need Help Getting Your Gmail App Password?**

Run this first if you haven't set up an app password:
1. Visit: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other"
3. Name it "FinTrack Test"
4. Copy the password
5. Use it in the script
