# Vercel Deployment Guide

This guide will help you deploy your Balanze application with social login to Vercel.

## Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed
- Supabase project configured
- Social login providers set up (Google & Apple)

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

2. **Follow the prompts**:
   - Login to Vercel if not already logged in
   - Confirm deployment settings
   - Wait for build and deployment

### Option 2: Manual Deployment

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Environment Configuration

### 1. Create Environment File

Copy the template and update with your values:

```bash
cp env.template .env
```

### 2. Required Environment Variables

Update your `.env` file with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_GOOGLE_LOGIN=true
VITE_ENABLE_APPLE_LOGIN=true

# Environment
VITE_ENVIRONMENT=production
NODE_ENV=production
```

### 3. Vercel Environment Variables

Set environment variables in Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_GOOGLE_LOGIN=true
VITE_ENABLE_APPLE_LOGIN=true
VITE_ENVIRONMENT=production
NODE_ENV=production
```

## Social Login Configuration

### 1. Update Supabase Redirect URLs

In your Supabase dashboard:

1. Go to "Authentication" > "URL Configuration"
2. Update the Site URL to your Vercel domain
3. Add redirect URLs:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/dashboard
   ```

### 2. Update Google OAuth

In Google Cloud Console:

1. Go to "APIs & Services" > "Credentials"
2. Edit your OAuth 2.0 client
3. Add authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   ```

### 3. Update Apple Sign-In

In Apple Developer Console:

1. Go to "Certificates, Identifiers & Profiles"
2. Edit your Services ID
3. Add your Vercel domain to "Domains and Subdomains"
4. Update redirect URLs in Supabase Apple provider settings

## Deployment Configuration

### Vercel Configuration (vercel.json)

The `vercel.json` file is already configured with:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Security Headers**: XSS protection, content type options
- **Caching**: Static assets cached for 1 year
- **SPA Routing**: All routes redirect to index.html

### Build Optimization

The deployment includes:

- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Unused code removal
- **Minification**: CSS and JS minification
- **Compression**: Gzip compression
- **CDN**: Global content delivery network

## Testing the Deployment

### 1. Automated Testing

Run the test script:

```bash
node test_social_login.js
```

### 2. Manual Testing

1. **Visit your deployed app**
2. **Test email/password login**
3. **Test Google login**
4. **Test Apple login**
5. **Test all main features**

### 3. Performance Testing

Check your app's performance:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Test performance
lighthouse https://your-app.vercel.app --output html
```

## Monitoring and Debugging

### 1. View Deployment Logs

```bash
vercel logs
```

### 2. Check Build Logs

```bash
vercel logs --follow
```

### 3. Open Deployment

```bash
vercel open
```

### 4. List Deployments

```bash
vercel ls
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `Module not found` or `Import error`

**Solution**:
- Check all imports are correct
- Ensure all dependencies are in `package.json`
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

#### 2. Environment Variables

**Error**: `VITE_SUPABASE_URL is not defined`

**Solution**:
- Check `.env` file exists
- Verify environment variables in Vercel dashboard
- Redeploy after adding variables

#### 3. Social Login Not Working

**Error**: `OAuth provider not enabled`

**Solution**:
- Enable providers in Supabase dashboard
- Update redirect URLs
- Check browser console for errors

#### 4. CORS Errors

**Error**: `CORS policy violation`

**Solution**:
- Add your domain to Supabase allowed origins
- Check Vercel domain in Supabase settings

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed requests
3. **Verify environment variables** are set correctly
4. **Test locally** before deploying
5. **Check Vercel logs** for build errors

## Performance Optimization

### 1. Bundle Analysis

Analyze your bundle size:

```bash
npm install -g vite-bundle-analyzer
npm run build -- --analyze
```

### 2. Image Optimization

- Use WebP format for images
- Implement lazy loading
- Use responsive images

### 3. Code Splitting

The app already includes:
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy components

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files
- Use Vercel environment variables
- Rotate keys regularly

### 2. HTTPS

- Vercel provides automatic HTTPS
- All traffic is encrypted
- HSTS headers are enabled

### 3. Security Headers

The deployment includes:
- XSS Protection
- Content Type Options
- Frame Options
- Referrer Policy

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] All features work as expected
- [ ] Social login functions properly
- [ ] Environment variables are set
- [ ] Redirect URLs are configured
- [ ] Performance is acceptable
- [ ] Security headers are in place
- [ ] Error monitoring is set up
- [ ] Analytics are configured (optional)

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# Open deployment
vercel open

# List deployments
vercel ls

# Remove deployment
vercel remove

# Update environment variables
vercel env add VITE_SUPABASE_URL
```

## Support

If you encounter issues:

1. Check [Vercel documentation](https://vercel.com/docs)
2. Review [Supabase Auth docs](https://supabase.com/docs/guides/auth)
3. Check Vercel community forums
4. Review deployment logs for specific errors

## Next Steps

After successful deployment:

1. **Set up monitoring** (optional)
2. **Configure custom domain** (optional)
3. **Set up analytics** (optional)
4. **Implement CI/CD** (optional)
5. **Set up error tracking** (optional) 