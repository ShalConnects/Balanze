# OAuth Setup Steps - Fix "Provider is not enabled" Error

## 🚨 **Current Issue**
You're getting: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

This means the OAuth providers are enabled but missing credentials.

## 🔧 **Step-by-Step Fix**

### **Step 1: Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your project: `xgncksougafnfbtusfnf`

### **Step 2: Check Current Status**
1. Go to **Authentication** → **Providers**
2. Look for **Google** and **Apple**
3. Check if they show as "Enabled" but with missing credentials

### **Step 3: Configure Google OAuth**

#### **3.1 Get Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** (or select existing):
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: `Balanze OAuth`
   - Click "Create"

3. **Enable Google+ API**:
   - Go to **"APIs & Services"** → **"Library"**
   - Search for **"Google+ API"**
   - Click on it and click **"Enable"**

4. **Create OAuth 2.0 credentials**:
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
   - Choose **"Web application"**
   - **Name**: `Balanze Web Client`
   - **Authorized redirect URIs** (add these):
     ```
     https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
   - Click **"Create"**
   - **Copy the Client ID and Client Secret**

#### **3.2 Add to Supabase**
1. Back in **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and click **"Edit"**
3. **Enable** the provider (toggle should be ON)
4. **Client ID**: Paste your Google Client ID
5. **Client Secret**: Paste your Google Client Secret
6. Click **"Save"**

### **Step 4: Configure Apple OAuth**

#### **4.1 Get Apple OAuth Credentials**
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Go to **"Certificates, Identifiers & Profiles"**

4. **Create App ID**:
   - Click **"Identifiers"** → **"+"** → **"App IDs"**
   - Choose **"App"**
   - **Description**: `Balanze App`
   - **Bundle ID**: `com.yourcompany.balanze`
   - Enable **"Sign In with Apple"**
   - Click **"Continue"** and **"Register"**

5. **Create Service ID**:
   - Click **"Identifiers"** → **"+"** → **"Services IDs"**
   - Choose **"Services"**
   - **Description**: `Balanze OAuth Service`
   - **Identifier**: `com.yourcompany.balanze.oauth`
   - Enable **"Sign In with Apple"**
   - **Domain**: `xgncksougafnfbtusfnf.supabase.co`
   - **Redirect URL**: `https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback`
   - Click **"Continue"** and **"Register"**

6. **Create OAuth Client**:
   - Go to **"Keys"** → **"+"** → **"OAuth Client IDs"**
   - Choose **"Sign In with Apple"**
   - **Name**: `Balanze OAuth Client`
   - Select your **Service ID**
   - Click **"Continue"**
   - Download the key file (.p8)
   - Note your **Team ID** and **Key ID**

#### **4.2 Add to Supabase**
1. Back in **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Apple** and click **"Edit"**
3. **Enable** the provider (toggle should be ON)
4. **Client ID**: Your Service ID (e.g., `com.yourcompany.balanze.oauth`)
5. **Team ID**: Your Apple Team ID
6. **Key ID**: Your Key ID
7. **Private Key**: Upload your downloaded .p8 file
8. Click **"Save"**

### **Step 5: Update URL Configuration**

1. In **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs** (add these):
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/dashboard
   https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

### **Step 6: Test the Configuration**

1. **Clear browser cache** and restart your dev server:
   ```bash
   npm run dev
   ```

2. **Test Google login**:
   - Go to your app
   - Click "Continue with Google"
   - Should redirect to Google OAuth page

3. **Test Apple login**:
   - Click "Continue with Apple"
   - Should redirect to Apple Sign-In page

## 🧪 **Verification Steps**

### **Check Supabase Dashboard**
- Go to **Authentication** → **Providers**
- Both Google and Apple should show as **"Enabled"**
- Should show green checkmarks for configuration

### **Check Browser Console**
- Open Developer Tools (F12)
- Go to Console tab
- Try social login
- Look for any error messages

### **Check Network Tab**
- Open Developer Tools (F12)
- Go to Network tab
- Try social login
- Look for failed requests to Supabase

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Provider is not enabled"**
**Solution**: Enable the provider in Supabase Dashboard

### **Issue 2: "Invalid client"**
**Solution**: Check Client ID and Secret are correct

### **Issue 3: "Redirect URI mismatch"**
**Solution**: Verify redirect URIs match exactly

### **Issue 4: Apple Sign-In not working**
**Solution**: 
- Verify Service ID is correct
- Check domain is added to Apple Developer Console
- Ensure .p8 key file is uploaded correctly

## 📞 **Need Help?**

If you're still getting errors:

1. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

2. **Verify credentials**:
   - Double-check all IDs and secrets
   - Ensure no extra spaces or characters

3. **Test with different browser**:
   - Try incognito/private mode
   - Clear all cookies and cache

## ✅ **Success Indicators**

When properly configured:
- ✅ Social login buttons work without errors
- ✅ OAuth redirects work smoothly
- ✅ User accounts are created automatically
- ✅ Users can log in with social accounts
- ✅ Profile information is synced correctly

---

**Note**: Keep your OAuth credentials secure and never commit them to version control! 