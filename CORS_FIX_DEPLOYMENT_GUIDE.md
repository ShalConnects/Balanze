# CORS Fix Deployment Guide

## Problem
The Last Wish email API endpoint was returning CORS errors when accessed from `http://localhost:5173` during development.

## Changes Made

### 1. Updated API Endpoint (`api/send-last-wish-email.js`)
- Added comprehensive CORS headers
- Created CORS middleware for consistent header handling
- Added support for specific allowed origins including `http://localhost:5173`
- Improved error handling to ensure CORS headers are set even on errors

### 2. Updated Vercel Configuration (`vercel.json`)
- Added specific API route handling to prevent conflicts with SPA routing
- Added CORS headers at the platform level for all `/api/*` routes
- Ensured API routes are properly handled before SPA fallback

### 3. Created CORS Middleware (`api/cors-middleware.js`)
- Centralized CORS header management
- Reusable across all API endpoints
- Consistent origin handling

### 4. Created Test Endpoint (`api/cors-test.js`)
- Simple endpoint for testing CORS functionality
- Comprehensive logging for debugging

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)
1. Commit all changes:
   ```bash
   git add .
   git commit -m "Fix CORS issues for Last Wish API endpoints"
   git push origin master
   ```

2. The changes will automatically deploy to Vercel if auto-deployment is enabled.

### Option 2: Manual Vercel Deployment
1. Install Vercel CLI if not already installed:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

## Testing the Fix

### 1. Test CORS Headers
Run the test script:
```bash
node test-cors-fix.js
```

### 2. Test from Frontend
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Last Wish section in your app
3. Try the "Test Real Email" button
4. Check browser console for CORS errors

### 3. Manual CORS Test
You can also test manually using curl:
```bash
# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://balanze.cash/api/send-last-wish-email

# Test actual POST request
curl -X POST \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","testMode":true}' \
  https://balanze.cash/api/send-last-wish-email
```

## Expected Results

After deployment, you should see:
- ✅ No CORS errors in browser console
- ✅ Successful API calls from `http://localhost:5173`
- ✅ Proper CORS headers in response
- ✅ Working Last Wish email functionality

## Troubleshooting

### If CORS errors persist:
1. Check if deployment completed successfully
2. Verify the API endpoint is accessible: `https://balanze.cash/api/cors-test`
3. Check Vercel function logs for any errors
4. Ensure environment variables are properly set

### If API returns 500 errors:
1. Check Vercel function logs
2. Verify Supabase credentials are set
3. Check SMTP configuration for email sending

## Files Modified
- `api/send-last-wish-email.js` - Main API endpoint with CORS fixes
- `vercel.json` - Platform-level CORS configuration
- `api/cors-middleware.js` - New CORS middleware
- `api/cors-test.js` - New test endpoint
- `test-cors-fix.js` - Test script

## Next Steps
1. Deploy the changes
2. Test the functionality
3. Remove test files if not needed:
   - `api/cors-test.js`
   - `test-cors-fix.js`
   - `CORS_FIX_DEPLOYMENT_GUIDE.md`
