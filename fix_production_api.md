# Fix Production API - Environment Variables Issue

## 🎯 Problem Identified

The production API is failing with `FUNCTION_INVOCATION_FAILED` because:

1. **Environment Variables**: The API is looking for `VITE_SUPABASE_URL` but in production it should be `SUPABASE_URL`
2. **SMTP Configuration**: The email API needs SMTP credentials to work
3. **Missing Dependencies**: The API might be missing required environment variables

## 🛠️ What I Fixed

### **1. Environment Variable Fix**
Updated all API files to use the correct environment variables:
```javascript
// Before (causing errors)
process.env.VITE_SUPABASE_URL

// After (works in both local and production)
process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
```

### **2. SMTP Configuration Check**
Added proper SMTP configuration validation:
```javascript
// Check if SMTP is configured
if (!transporter) {
  return res.status(500).json({ 
    error: 'SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables.',
    testMode 
  });
}
```

### **3. Better Error Handling**
Added proper error handling to prevent API crashes.

## 📋 Required Environment Variables

For the production API to work, you need these environment variables in your Vercel deployment:

### **Required:**
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
```

### **For Email Functionality:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 How to Fix Production

### **Step 1: Set Environment Variables in Vercel**

1. Go to your **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the required variables:

```
SUPABASE_URL = https://xgncksougafnfbtusfnf.supabase.co
SUPABASE_SERVICE_KEY = your-service-key
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-app-password
```

### **Step 2: Redeploy**

After adding environment variables:
1. **Redeploy** your project in Vercel
2. The API should work now

### **Step 3: Test the API**

Test the fixed API:
```bash
curl -X POST "https://balanze.cash/api/send-last-wish-email" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","testMode":true}'
```

## 🎯 Expected Results After Fix

### **Before Fix:**
```
FUNCTION_INVOCATION_FAILED
```

### **After Fix:**
```json
{
  "success": true,
  "message": "Test emails sent to X recipient(s)",
  "testMode": true
}
```

## 🔍 Testing the Fix

### **1. Test the Background Process API:**
```bash
curl https://balanze.cash/api/last-wish-public
```
**Expected**: `{"success":true,"processedCount":0,...}`

### **2. Test the Email API:**
```bash
curl -X POST https://balanze.cash/api/send-last-wish-email \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","testMode":true}'
```
**Expected**: Success response or clear error message

## 🎉 Benefits of the Fix

1. **✅ Works in Production** - Correct environment variables
2. **✅ Better Error Messages** - Clear feedback on what's wrong
3. **✅ SMTP Validation** - Checks if email is configured
4. **✅ Graceful Failures** - API doesn't crash on errors

## 🚨 Important Notes

- **Environment variables** must be set in Vercel dashboard
- **SMTP credentials** are required for email functionality
- **Redeploy** after adding environment variables
- **Test both APIs** to ensure they work

The production API should work globally once you set the environment variables in Vercel!
