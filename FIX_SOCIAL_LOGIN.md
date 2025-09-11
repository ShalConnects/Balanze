# Fix Social Login Provider Error

## Error: `"Unsupported provider: provider is not enabled"`

This error occurs because Google and Apple OAuth providers are not enabled in your Supabase project. Here's how to fix it:

## Step 1: Enable OAuth Providers in Supabase

### 1.1 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**

### 1.2 Enable Google Provider
1. Find **Google** in the providers list
2. Click the toggle to **enable** it
3. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret

### 1.3 Enable Apple Provider
1. Find **Apple** in the providers list
2. Click the toggle to **enable** it
3. Add your Apple credentials:
   - **Client ID**: Your Services ID (e.g., com.yourcompany.yourapp)
   - **Client Secret**: Generate using your private key
   - **Team ID**: Your Apple Developer Team ID
   - **Key ID**: The key ID from your private key

## Step 2: Configure Google OAuth (If not done)

### 2.1 Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     https://balanze.cash/auth/callback
     ```

### 2.2 Add Credentials to Supabase
1. Copy your Google Client ID and Client Secret
2. Paste them into the Google provider settings in Supabase

## Step 3: Configure Apple Sign-In (If not done)

### 3.1 Apple Developer Setup
1. Go to [Apple Developer](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a Services ID:
   - Go to "Identifiers" → "Services IDs"
   - Click "+" to create new
   - Choose "Services" and fill in details
   - Enable "Sign In with Apple"
   - Add your domain to "Domains and Subdomains"
4. Create a private key:
   - Go to "Keys" → "All"
   - Click "+" to create new
   - Enable "Sign In with Apple"
   - Download the key file (.p8)

### 3.2 Add Credentials to Supabase
1. Copy your Services ID, Team ID, and Key ID
2. Generate the client secret using your private key
3. Paste them into the Apple provider settings in Supabase

## Step 4: Update Redirect URLs

### 4.1 Supabase URL Configuration
1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Update the Site URL to your Vercel domain:
   ```
   https://balanze.cash
   ```
3. Add redirect URLs:
   ```
   https://balanze.cash/auth/callback
   https://balanze.cash/dashboard
   ```

### 4.2 Google OAuth Redirect URLs
1. In Google Cloud Console, edit your OAuth 2.0 client
2. Add these authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   https://balanze.cash/auth/callback
   ```

### 4.3 Apple Sign-In Redirect URLs
1. In Apple Developer Console, edit your Services ID
2. Add your Vercel domain to "Domains and Subdomains"
3. Update redirect URLs in Supabase Apple provider settings

## Step 5: Test the Configuration

### 5.1 Run the Test Script
```bash
node test_social_login.js
```

### 5.2 Manual Testing
1. Visit your deployed app: https://balanze.cash
2. Try clicking "Continue with Google"
3. Try clicking "Continue with Apple"
4. Check browser console for any errors

## Step 6: Troubleshooting

### Common Issues:

#### 1. "Provider not enabled" error
- **Solution**: Enable the provider in Supabase dashboard
- **Check**: Authentication → Providers → Google/Apple

#### 2. "Redirect URI mismatch" error
- **Solution**: Update redirect URIs in both Supabase and OAuth providers
- **Check**: Ensure URLs match exactly (including protocol and trailing slashes)

#### 3. "Invalid client" error
- **Solution**: Verify OAuth credentials are correct
- **Check**: Client ID, Client Secret, Team ID, Key ID

#### 4. CORS errors
- **Solution**: Add your domain to Supabase allowed origins
- **Check**: Authentication → URL Configuration → Allowed Origins

### Debug Steps:
1. Check browser console for specific error messages
2. Verify all credentials are correct
3. Test with different browsers
4. Check Supabase logs in dashboard
5. Verify environment variables are set correctly

## Step 7: Verify Success

After configuration, you should see:
- ✅ Google login button works
- ✅ Apple login button works
- ✅ Users can authenticate with social providers
- ✅ Users are redirected to dashboard after login
- ✅ No console errors

## Quick Fix Commands

If you need to quickly test without full OAuth setup:

```bash
# Test current configuration
node test_social_login.js

# Check environment variables
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: $VITE_SUPABASE_ANON_KEY"

# Deploy with updated configuration
vercel --prod
```

## Support

If you continue to have issues:
1. Check [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth setup](https://developers.google.com/identity/protocols/oauth2)
3. Review [Apple Sign-In setup](https://developer.apple.com/sign-in-with-apple/)
4. Check Supabase community forums 