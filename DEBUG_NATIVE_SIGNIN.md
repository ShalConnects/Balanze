# 🔍 Debugging Native Google Sign-In Fallback Issue

## What Was Changed

I've improved the native Google Sign-In detection and error handling to help diagnose why it's falling back to browser OAuth.

### Changes Made:

1. **Added Interface Wait Mechanism** (`waitForNativeInterface`)
   - Waits up to 2 seconds for `GoogleSignInNative` to be available
   - Checks every 100ms
   - Provides detailed logging if interface isn't found

2. **Enhanced Logging**
   - More detailed console.error messages at each step
   - Logs when interface is found/not found
   - Logs callback IDs and responses
   - Logs timeout information

3. **Better Error Handling**
   - Fixed timeout variable scope issue
   - Improved callback handler cleanup
   - More specific error messages

## How to Debug

### Step 1: Check Android Logcat

When you try to sign in, check the logs:

```bash
adb logcat | Select-String "GoogleSignIn"
```

Look for these key messages:

**✅ Success indicators:**
- `[GoogleSignIn] ✅ Native interface is now available`
- `[GoogleSignIn] ✅ Calling native interface directly`
- `[GoogleSignIn] ✅ Native signIn() called successfully`

**❌ Problem indicators:**
- `[GoogleSignIn] ❌ Native interface not available after waiting`
- `[GoogleSignIn] ⏱️ Timeout waiting for native interface`
- `[GoogleSignIn] ❌ Native interface not available when calling`

### Step 2: Check WebView Console

Also check the WebView console logs:

```bash
adb logcat | Select-String "WebView|MainActivity"
```

Look for:
- `[MainActivity] ✅ GoogleSignInNative interface is available`
- `[MainActivity] ✅ JavaScript interface 'GoogleSignInNative' added to WebView`

### Step 3: Verify Interface Injection

The interface should be injected in `MainActivity.onCreate()`. Check if you see:
- `✅ JavaScript interface 'GoogleSignInNative' added to WebView`
- `✅ JavaScript code injected to expose plugin`

## Common Issues and Solutions

### Issue 1: Interface Not Available

**Symptoms:**
- Logs show: `❌ Native interface not available after waiting`
- Falls back to browser immediately

**Possible Causes:**
1. **App not rebuilt** - The native interface is added in Java code, so you need to rebuild
2. **WebView not fully loaded** - The interface is added in `onCreate()`, but WebView might not be ready
3. **Timing issue** - JavaScript runs before interface is injected

**Solution:**
- Rebuild the app: `npm run android:build`
- Wait a few seconds after app starts before trying to sign in
- Check if the interface test message appears in logs

### Issue 2: Interface Available But Call Fails

**Symptoms:**
- Logs show: `✅ Native interface found` but then error
- Falls back to browser after native call

**Possible Causes:**
1. **DEVELOPER_ERROR** - SHA-1 not configured (should be fixed now)
2. **Network error** - Google Play Services issue
3. **User cancellation** - User cancelled the picker

**Solution:**
- Check the error message in logs
- Verify SHA-1 is configured in Google Cloud Console
- Check Google Play Services is up to date

### Issue 3: Callback Not Received

**Symptoms:**
- Logs show: `✅ Native signIn() called successfully` but no callback
- Timeout after 30 seconds

**Possible Causes:**
1. **Callback handler not set up correctly**
2. **Native code not calling callback**
3. **JavaScript context issue**

**Solution:**
- Check `MainActivity.java` - `sendResultToJS()` method
- Verify `GoogleSignInCallback` is being called
- Check for JavaScript errors in WebView console

## Testing Checklist

After rebuilding, test and check:

- [ ] App rebuilt with latest changes
- [ ] Check logcat for interface availability messages
- [ ] Try signing in and watch logs
- [ ] Note which path it takes (native vs browser)
- [ ] Share relevant log snippets if still having issues

## Next Steps

1. **Rebuild the app:**
   ```bash
   npm run build
   npx cap sync android
   cd android
   .\gradlew assembleRelease
   ```

2. **Install and test:**
   ```bash
   adb install -r app/build/outputs/apk/release/app-release.apk
   ```

3. **Monitor logs while testing:**
   ```bash
   adb logcat | Select-String "GoogleSignIn|OAUTH|MainActivity"
   ```

4. **Try signing in** and watch the logs to see:
   - Is the interface detected?
   - Does the native call succeed?
   - What error (if any) causes fallback?

## Expected Flow

1. User taps "Sign in with Google"
2. Code checks: `Capacitor.getPlatform() === 'android'` ✅
3. Code waits for `GoogleSignInNative` interface (up to 2 seconds)
4. If found: Calls `nativeInterface.signIn(callbackId)`
5. Native code shows account picker
6. User selects account
7. Native code calls `GoogleSignInCallback(callbackId, result)`
8. JavaScript receives result and exchanges with Supabase
9. User is signed in ✅

If any step fails, it falls back to browser OAuth.

---

**Share the logs** from your test and we can pinpoint exactly where it's failing!

