# 🧪 Paddle Sandbox Setup Guide

## 🎯 What You Need to Do

Based on the Paddle documentation you provided, here's your step-by-step setup:

### **Step 1: Create Sandbox Account** ✅

1. **Go to**: [https://sandbox-vendors.paddle.com/signup](https://sandbox-vendors.paddle.com/signup)
2. **Enter your details** (can use test data)
3. **Click "Continue"** to create your account

### **Step 2: Get Your Sandbox Credentials**

#### **A. Client-Side Token (Required)**
1. Go to **Developer Tools** → **Authentication**
2. Click **"New client-side token"**
3. Name it "FinTrack Sandbox"
4. Copy the token (starts with `test_`)

#### **B. Vendor ID**
1. In **Authentication** section, find your **Vendor ID**
2. Copy this numeric ID

#### **C. API Key (Optional - for backend)**
1. In **Authentication** section, create new **API key**
2. Copy the key (contains `_sdbx` for sandbox)

### **Step 3: Create Test Products**

1. Go to **Catalog** → **Products**
2. Create these products:
   - **Premium Monthly** - $7.99/month (recurring)
   - **Premium Lifetime** - $199.99 one-time
3. Copy the **Price IDs** (start with `pri_`)

### **Step 4: Create .env.local File**

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration (keep your existing values)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paddle Sandbox Configuration
VITE_PADDLE_VENDOR_ID=your_sandbox_vendor_id_here
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_CLIENT_TOKEN=test_your_sandbox_client_token_here
VITE_PADDLE_MONTHLY_PRICE_ID=pri_01xxxxxxxxxxxxxxxxxxxxx
VITE_PADDLE_LIFETIME_PRICE_ID=pri_01xxxxxxxxxxxxxxxxxxxxx

# Development Settings
VITE_ENVIRONMENT=development
NODE_ENV=development
```

### **Step 5: Replace Placeholder Values**

Replace these placeholders with your actual sandbox values:
- `your_sandbox_vendor_id_here` → Your sandbox vendor ID
- `test_your_sandbox_client_token_here` → Your sandbox client token
- `pri_01xxxxxxxxxxxxxxxxxxxxx` → Your actual price IDs

### **Step 6: Test the Integration**

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Test the payment flow**:
   - Go to `http://localhost:5173/settings?tab=plans-usage`
   - Click "Get Started" on Premium plan
   - Click "Pay with Paddle"

### **Step 7: Use Test Cards**

Paddle provides test card numbers for sandbox testing:
- **Success**: 4000 0000 0000 0002
- **Decline**: 4000 0000 0000 0003
- **3D Secure**: 4000 0000 0000 3220

## 🎯 What Should Happen

With proper sandbox setup:
1. ✅ Paddle loads without errors
2. ✅ Checkout opens in overlay modal
3. ✅ Test payments work with test cards
4. ✅ Events are properly handled

## 🔧 Your Current Integration

Your code is already set up correctly with:
- ✅ Paddle.js v2 integration (`@paddle/paddle-js`)
- ✅ Environment variable configuration
- ✅ Proper error handling and fallbacks
- ✅ Event handling for payment success

You just need the sandbox credentials!
