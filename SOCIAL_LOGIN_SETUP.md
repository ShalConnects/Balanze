# Social Login Setup Guide

This guide will help you configure Google and Apple social login for your Balanze application using Supabase.

## Prerequisites

- Supabase project set up
- Google Cloud Console account (for Google OAuth)
- Apple Developer account (for Apple Sign-In)

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback (for development)
     ```

### Step 2: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret

## 2. Apple Sign-In Setup

### Step 1: Configure Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a new App ID:
   - Go to "Identifiers" > "App IDs"
   - Click "+" to create new
   - Choose "App" and fill in details
   - Enable "Sign In with Apple" capability
4. Create a Services ID:
   - Go to "Identifiers" > "Services IDs"
   - Click "+" to create new
   - Choose "Services" and fill in details
   - Enable "Sign In with Apple"
   - Add your domain to "Domains and Subdomains"
5. Create a private key:
   - Go to "Keys" > "All"
   - Click "+" to create new
   - Enable "Sign In with Apple"
   - Download the key file (.p8)

### Step 2: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Apple provider
4. Add your Apple credentials:
   - **Client ID**: Your Services ID (e.g., com.yourcompany.yourapp)
   - **Client Secret**: Generate using your private key
   - **Team ID**: Your Apple Developer Team ID
   - **Key ID**: The key ID from your private key

## 3. Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom OAuth redirect URLs
VITE_GOOGLE_REDIRECT_URL=https://your-domain.com/auth/callback
VITE_APPLE_REDIRECT_URL=https://your-domain.com/auth/callback
```

## 4. Testing Social Login

### Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test Google login:
   - Click "Continue with Google"
   - You should be redirected to Google's OAuth page
   - After authorization, you'll be redirected back to your app

3. Test Apple login:
   - Click "Continue with Apple"
   - You should be redirected to Apple's Sign-In page
   - After authorization, you'll be redirected back to your app

### Production Testing

1. Deploy your application
2. Update redirect URLs in both Google and Apple configurations
3. Test the complete flow in production

## 5. Troubleshooting

### Common Issues

1. **Redirect URI mismatch**:
   - Ensure redirect URIs in Google/Apple match exactly with Supabase
   - Check for trailing slashes and protocol (http vs https)

2. **CORS errors**:
   - Add your domain to authorized origins in Supabase
   - Check browser console for CORS-related errors

3. **Apple Sign-In not working**:
   - Verify your Services ID is properly configured
   - Check that your domain is added to the Services ID
   - Ensure your private key is valid and not expired

4. **Google OAuth errors**:
   - Verify Google+ API is enabled
   - Check that your OAuth consent screen is configured
   - Ensure redirect URIs are correct

### Debug Steps

1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different browsers
4. Check network tab for failed requests

## 6. Security Considerations

1. **HTTPS Required**: Social login requires HTTPS in production
2. **Domain Verification**: Ensure your domain is verified with Apple
3. **Key Rotation**: Regularly rotate your OAuth keys
4. **Rate Limiting**: Monitor for unusual authentication patterns

## 7. Additional Configuration

### Custom Redirect Handling

You can customize the redirect behavior by modifying the `handleSocialLogin` function in `src/pages/Auth.tsx`:

```typescript
const handleSocialLogin = async (provider: 'google' | 'apple') => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      console.error('Social login error:', error);
    } else {
      console.log('Social login initiated:', data);
    }
  } catch (error) {
    console.error('Social login exception:', error);
  }
};
```

### Profile Data Mapping

When users sign in with social providers, you may want to map their profile data:

```typescript
// In your auth store or component
const handleSocialLoginSuccess = (user: User) => {
  // Map social provider data to your user profile
  const profile = {
    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
    provider: user.app_metadata?.provider
  };
  
  // Update your profile in the database
  updateUserProfile(user.id, profile);
};
```

## 8. Production Checklist

- [ ] Google OAuth configured with production redirect URIs
- [ ] Apple Sign-In configured with production domain
- [ ] HTTPS enabled on your domain
- [ ] Environment variables set correctly
- [ ] Social login tested in production
- [ ] Error handling implemented
- [ ] User profile mapping configured
- [ ] Security headers configured
- [ ] Rate limiting implemented

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Review [Apple Sign-In documentation](https://developer.apple.com/sign-in-with-apple/)
4. Check Supabase community forums
5. Review browser console and network logs for specific errors 