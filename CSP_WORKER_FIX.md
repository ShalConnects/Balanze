# CSP Worker Directive Fix

## Issue
Sentry is trying to create a Web Worker from a blob URL, but the Content Security Policy is blocking it.

## Solution Applied
Updated `vercel.json` to include:
- `worker-src 'self' blob: data:;`
- `child-src 'self' blob: data:;` (fallback for older browsers)

## Current CSP Configuration
```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paddle.com https://*.paddlejs.com https://*.vercel-insights.com https://va.vercel-scripts.com; worker-src 'self' blob: data:; child-src 'self' blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://*.paddle.com https://*.paddlejs.com https://*.vercel-insights.com wss://*.supabase.co; frame-src 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
```

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add vercel.json
git commit -m "Fix CSP worker-src directive for Sentry"
git push
```

### 2. Wait for Vercel Deployment
- Vercel will automatically deploy on push
- Wait for deployment to complete (check Vercel dashboard)

### 3. Clear Browser Cache
After deployment:
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or use Incognito/Private Window**: Test in a fresh browser session
3. **Or Clear Cache**: 
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

### 4. Verify the Fix

#### Check Response Headers
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Click on the main document request (usually `balanze.cash`)
5. Check Response Headers
6. Look for `Content-Security-Policy` header
7. Verify it contains `worker-src 'self' blob: data:;`

#### Check Console
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. The error should be gone after deployment and cache clear

#### Check Issues Panel
1. Open Chrome DevTools (F12)
2. Go to Issues tab
3. No CSP violations should appear

## Troubleshooting

### If Error Persists After Deployment

1. **Verify Deployment**: Check Vercel dashboard to ensure deployment completed successfully

2. **Check Response Headers**: 
   - Use browser DevTools → Network tab
   - Verify the CSP header is being sent
   - Check if `worker-src` is in the header

3. **Test in Incognito**: 
   - Open an incognito/private window
   - This bypasses browser cache

4. **Check for Multiple CSP Headers**:
   - Some servers/apps set CSP in multiple places
   - Ensure only one CSP header is being sent
   - Multiple CSP headers can conflict

5. **Verify CSP Syntax**:
   - Each directive should end with `;`
   - No extra spaces or characters
   - Quotes around `'self'`, `'unsafe-inline'`, etc.

## Expected Result

After successful deployment and cache clear:
- ✅ No CSP errors in browser console
- ✅ No CSP violations in Issues panel
- ✅ Sentry replay works without errors
- ✅ Web Workers can be created from blob URLs

## Notes

- CSP headers are cached by browsers
- Changes may take a few minutes to propagate
- Always test in incognito/private window after deployment
- The `child-src` directive is included as a fallback for older browsers that don't support `worker-src`

