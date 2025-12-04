# Vercel Environment Variables Checklist

## 🎯 Current Status

✅ **Background Process API**: Working (`/api/last-wish-public`)
❌ **Email API**: Still failing (`/api/send-last-wish-email`)

## 🔍 The Issue

The email API is still failing with `FUNCTION_INVOCATION_FAILED`. This means the SMTP environment variables are likely missing or incorrect.

## 📋 Required Environment Variables in Vercel

Go to your Vercel dashboard and make sure you have **ALL** of these variables set:

### **1. Supabase Configuration (✅ Working)**
```
VITE_SUPABASE_URL = https://xgncksougafnfbtusfnf.supabase.co
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
SUPABASE_SERVICE_KEY = your_supabase_service_key
```

### **2. SMTP Configuration (❌ Missing/Incorrect)**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-gmail-app-password
```

## 🚨 Critical: SMTP Configuration

The email API is failing because it can't send emails. You need to set up Gmail SMTP:

### **Step 1: Enable 2-Factor Authentication**
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Go to **Security**
3. Enable **2-Step Verification**

### **Step 2: Generate App Password**
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **Generate app password**
4. Select **Mail** and **Other (Custom name)**
5. Enter "FinTrack Last Wish"
6. Copy the 16-character password

### **Step 3: Set in Vercel**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-gmail-address@gmail.com
SMTP_PASS = your-16-character-app-password
```

## 🔧 How to Set in Vercel

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Settings** → **Environment Variables**
4. **Add each variable** with exact names and values
5. **Make sure to select all environments** (Production, Preview, Development)
6. **Redeploy** after adding all variables

## 🧪 Test After Setup

After setting SMTP variables and redeploying:

```bash
curl -X POST "https://balanze.cash/api/send-last-wish-email" \
  -H "Content-Type: application/json" \
  -d '{"userId":"cb3ac634-432d-4602-b2f9-3249702020d9","testMode":true}'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Test emails sent to X recipient(s)",
  "testMode": true
}
```

## 🔍 Troubleshooting

### **If still failing:**
1. **Check variable names** - must be exactly `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
2. **Check values** - no extra spaces, correct Gmail address
3. **Use App Password** - not your regular Gmail password
4. **Redeploy** - changes don't take effect until redeploy

### **Common Issues:**
- **Wrong password**: Use App Password, not regular password
- **2FA not enabled**: Must enable 2FA to use App Passwords
- **Wrong email**: Use the same email that has 2FA enabled
- **Not redeployed**: Must redeploy after adding variables

## 🎯 Next Steps

1. **Set SMTP environment variables** in Vercel
2. **Redeploy** your project
3. **Test the email API** again
4. **Try the "Send Real Test Email" button** in your app

The email API will work once you set the SMTP configuration correctly!
