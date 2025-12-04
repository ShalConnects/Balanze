# Setup Vercel Environment Variables

## 🎯 The Issue

You have environment variables in your local `.env.local` file, but **Vercel (production) doesn't use local environment files**. You need to set them in the Vercel dashboard.

## 🚀 How to Set Environment Variables in Vercel

### **Step 1: Go to Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Find your project (balanze.cash)
4. Click on your project

### **Step 2: Navigate to Environment Variables**

1. Click on **"Settings"** tab
2. Click on **"Environment Variables"** in the left sidebar
3. You'll see a list of current environment variables

### **Step 3: Add Required Environment Variables**

Click **"Add New"** and add these variables one by one:

#### **Required Variables:**

```
Name: VITE_SUPABASE_URL
Value: https://xgncksougafnfbtusfnf.supabase.co
Environment: Production, Preview, Development

Name: VITE_SUPABASE_ANON_KEY
Value: your_supabase_anon_key
Environment: Production, Preview, Development

Name: SUPABASE_SERVICE_KEY
Value: your_supabase_service_key
Environment: Production, Preview, Development
```

#### **For Email Functionality:**

```
Name: SMTP_HOST
Value: smtp.gmail.com
Environment: Production, Preview, Development

Name: SMTP_PORT
Value: 587
Environment: Production, Preview, Development

Name: SMTP_USER
Value: your-email@gmail.com
Environment: Production, Preview, Development

Name: SMTP_PASS
Value: your-app-password
Environment: Production, Preview, Development
```

#### **Optional Variables:**

```
Name: VITE_PAYPAL_CLIENT_ID
Value: your_paypal_client_id
Environment: Production, Preview, Development

Name: VITE_PAYPAL_ENVIRONMENT
Value: live
Environment: Production, Preview, Development
```

### **Step 4: Redeploy**

After adding all environment variables:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger a new deployment

## 🔍 How to Find Your Values

### **Supabase Values:**
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_KEY`

### **SMTP Values:**
- **SMTP_HOST**: `smtp.gmail.com` (for Gmail)
- **SMTP_PORT**: `587`
- **SMTP_USER**: Your Gmail address
- **SMTP_PASS**: Your Gmail App Password (not your regular password)

## 🎯 Expected Results

After setting environment variables and redeploying:

### **Test the API:**
```bash
curl https://balanze.cash/api/last-wish-public
```
**Expected**: `{"success":true,"processedCount":0,...}`

### **Test Email API:**
```bash
curl -X POST https://balanze.cash/api/send-last-wish-email \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","testMode":true}'
```
**Expected**: Success response or clear error message

## 🚨 Important Notes

1. **Environment variables are case-sensitive**
2. **No spaces around the `=` sign**
3. **Use quotes for values with spaces**
4. **Redeploy after adding variables**
5. **Test both APIs after deployment**

## 🔧 Troubleshooting

### **If API still fails:**
1. **Check variable names** - must match exactly
2. **Check values** - no extra spaces or characters
3. **Redeploy** - changes don't take effect until redeploy
4. **Check Vercel logs** - look for error messages

### **If email doesn't work:**
1. **Verify SMTP credentials** - test with Gmail
2. **Check Gmail App Password** - not regular password
3. **Enable 2FA** - required for App Passwords

## 🎉 After Setup

Once environment variables are set in Vercel:

1. **The production API will work globally**
2. **Email functionality will work**
3. **All features will work in production**
4. **Local development will still use `.env.local`**

The system will work globally once you set these environment variables in Vercel!
