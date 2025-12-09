# Quick Guide: Switch Android to Browser OAuth

If the native account picker is still not working reliably, you can quickly switch to browser-based OAuth which always shows the account picker.

## Option A: Quick Toggle (Recommended)

Add a feature flag to easily switch between native and browser OAuth:

### 1. Add Environment Variable

Add to `.env.local`:
```bash
VITE_USE_BROWSER_OAUTH_ANDROID=false  # Set to true to use browser OAuth
```

### 2. Update authStore.ts

In `src/store/authStore.ts`, modify the `signInWithProvider` function:

```typescript
if (isAndroid && provider === 'google') {
  // Check if browser OAuth is enabled via environment variable
  const useBrowserOAuth = import.meta.env.VITE_USE_BROWSER_OAUTH_ANDROID === 'true';
  
  if (useBrowserOAuth) {
    console.error('[OAUTH] 🌐 Using browser OAuth on Android (feature flag enabled)');
    return await get().fallbackToBrowserOAuth(provider, redirectUrl);
  }
  
  // Otherwise, try native sign-in...
  // ... rest of native sign-in code
}
```

---

## Option B: Permanent Switch (Simpler)

If you want to permanently use browser OAuth on Android, simply modify `src/store/authStore.ts`:

### Find this code (around line 473):
```typescript
if (isAndroid && provider === 'google') {
  // Use native Google Sign-In on Android for professional UX
  // ... native sign-in code
}
```

### Replace with:
```typescript
if (isAndroid && provider === 'google') {
  // Use browser OAuth on Android for reliable account picker
  console.error('[OAUTH] 🌐 Using browser OAuth on Android');
  return await get().fallbackToBrowserOAuth(provider, redirectUrl);
}
```

---

## Option C: Conditional Based on Account Count

You could also make it smart - use native if it works, fallback to browser if it doesn't show picker. But this is more complex.

---

## Testing

After making changes:
1. Rebuild the app: `npm run build && npx cap sync android`
2. Test on device
3. Account picker should always appear in browser

---

## Pros/Cons

**Browser OAuth:**
- ✅ Always shows account picker
- ✅ Consistent UX
- ✅ Works reliably
- ❌ Opens browser (less "native")
- ❌ Slightly slower

**Native OAuth:**
- ✅ More "native" feel
- ✅ Faster (no browser)
- ❌ Account picker doesn't always show
- ❌ Inconsistent UX

