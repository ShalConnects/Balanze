# Social Login Setup Guide for Balanze

This guide will help you configure Google and Apple OAuth providers in your Supabase project.

## 🎯 Overview

Your app already has the social login UI and code implemented. We just need to configure the OAuth providers in Supabase.

## 📋 Prerequisites

- Supabase project set up
- Google Cloud Console account (for Google OAuth)
- Apple Developer account (for Apple OAuth)
- Domain name for your app

## 🔧 Step 1: Configure Google OAuth

### 1.1 Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback (for development)
     ```
5. **Copy Client ID and Client Secret**

### 1.2 Supabase Configuration

1. **Go to Supabase Dashboard** > Your Project
2. **Navigate to**: Authentication > Providers
3. **Find Google** and click "Edit"
4. **Enable Google provider**
5. **Enter your credentials**:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
6. **Save changes**

## 🍎 Step 2: Configure Apple OAuth

### 2.1 Apple Developer Console Setup

1. **Go to Apple Developer Console**: https://developer.apple.com/
2. **Create App ID**:
   - Go to "Certificates, Identifiers & Profiles"
   - Click "Identifiers" > "+" > "App IDs"
   - Choose "App" and fill in details
   - Enable "Sign In with Apple"
3. **Create Service ID**:
   - Go to "Identifiers" > "+" > "Services IDs"
   - Choose "Services" and fill in details
   - Enable "Sign In with Apple"
   - Add domain: `your-project-ref.supabase.co`
   - Add redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. **Create OAuth Client**:
   - Go to "Keys" > "+" > "OAuth Client IDs"
   - Choose "Sign In with Apple"
   - Select your Service ID
   - Download the key file
5. **Copy Client ID and Team ID**

### 2.2 Supabase Configuration

1. **Go to Supabase Dashboard** > Your Project
2. **Navigate to**: Authentication > Providers
3. **Find Apple** and click "Edit"
4. **Enable Apple provider**
5. **Enter your credentials**:
   - Client ID: `your-apple-client-id`
   - Team ID: `your-apple-team-id`
   - Key ID: `your-apple-key-id`
   - Private Key: Upload your downloaded key file
6. **Save changes**

## 🧪 Step 3: Test the Implementation

### 3.1 Test Script

Run the test script to verify OAuth is working:

```bash
node test_social_login.js
```

### 3.2 Manual Testing

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to login page** and click:
   - "Continue with Google"
   - "Continue with Apple"

3. **Verify the flow**:
   - Should redirect to OAuth provider
   - Should redirect back to your app
   - Should create user account
   - Should redirect to dashboard

## 🔍 Step 4: Troubleshooting

### Common Issues

1. **"Provider is not enabled"**:
   - Check if provider is enabled in Supabase
   - Verify credentials are correct

2. **"Redirect URI mismatch"**:
   - Check redirect URIs in OAuth provider settings
   - Ensure they match Supabase callback URL

3. **"Invalid client"**:
   - Verify Client ID and Secret
   - Check if OAuth app is properly configured

4. **Apple Sign In not working**:
   - Verify Service ID configuration
   - Check domain verification
   - Ensure key file is uploaded correctly

### Debug Steps

1. **Check Supabase logs**:
   - Go to Supabase Dashboard > Logs
   - Look for authentication errors

2. **Check browser console**:
   - Open Developer Tools
   - Look for OAuth errors

3. **Test with different browsers**:
   - Some OAuth providers have browser-specific issues

## 📱 Step 5: Production Setup

### 5.1 Update Redirect URIs

For production, update redirect URIs in both Google and Apple:

```
https://your-domain.com/auth/callback
```

### 5.2 Environment Variables

Ensure your environment variables are set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5.3 Domain Verification

- **Google**: Add your domain to authorized domains
- **Apple**: Verify domain ownership in Apple Developer Console

## ✅ Success Indicators

When properly configured, you should see:

1. ✅ Social login buttons work without errors
2. ✅ OAuth redirects work smoothly
3. ✅ User accounts are created automatically
4. ✅ Users can log in with social accounts
5. ✅ Profile information is synced correctly

## 🚀 Next Steps

After setup:

1. **Test thoroughly** with different accounts
2. **Monitor logs** for any issues
3. **Update documentation** for your team
4. **Consider additional providers** (GitHub, Discord, etc.)

## 📞 Support

If you encounter issues:

1. Check Supabase documentation
2. Review OAuth provider documentation
3. Check browser console for errors
4. Verify all configuration steps

---

**Note**: Keep your OAuth credentials secure and never commit them to version control! 