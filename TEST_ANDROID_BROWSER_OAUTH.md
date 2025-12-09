# 🧪 Testing Guide: Android Browser OAuth

This guide will help you test the browser OAuth implementation for Google Sign-In on Android.

## 📋 Pre-Testing Checklist

Before testing, ensure you have:

- [ ] **Built the app** with the latest changes
- [ ] **Synced Capacitor** to copy web assets to Android
- [ ] **Android device or emulator** ready
- [ ] **Google account(s)** available for testing
- [ ] **Supabase OAuth configured** with correct redirect URLs
- [ ] **Environment variables** set correctly

## 🔧 Step 1: Build and Sync

### 1.1 Build the Web App
```bash
npm run build
```

This creates the production build in the `dist` folder.

### 1.2 Sync Capacitor
```bash
npx cap sync android
```

This copies the built files to the Android project and ensures all plugins are properly configured.

### 1.3 Verify Build
- Check that `dist` folder contains built files
- Check that `android/app/src/main/assets/public` has the latest files (Capacitor syncs here)

## 📱 Step 2: Build Android App

### Option A: Using Android Studio (Recommended)

1. **Open Android Studio**
   ```bash
   npx cap open android
   ```

2. **Build the APK**
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use `Build` → `Generate Signed Bundle / APK` for release builds

3. **Install on Device**
   - Connect your Android device via USB
   - Enable USB debugging
   - Click `Run` (green play button) or use `Shift+F10`

### Option B: Using Command Line

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🧪 Step 3: Testing Scenarios

### Test 1: Basic Google Sign-In Flow ✅

**Goal:** Verify the browser OAuth flow works end-to-end

**Steps:**
1. Open the app on Android device
2. Navigate to the login/auth screen
3. Tap "Sign in with Google"
4. **Expected:** Browser should open with Google account picker
5. Select a Google account
6. **Expected:** Browser redirects back to app
7. **Expected:** App shows "Completing Login" screen
8. **Expected:** User is redirected to dashboard

**Success Criteria:**
- ✅ Browser opens automatically
- ✅ Account picker shows (even with single account)
- ✅ App receives callback successfully
- ✅ User is authenticated and redirected to dashboard

---

### Test 2: Multiple Accounts Selection 🔄

**Goal:** Verify account picker shows when multiple accounts exist

**Prerequisites:**
- Device has 2+ Google accounts signed in

**Steps:**
1. Open the app
2. Tap "Sign in with Google"
3. **Expected:** Browser shows account picker with all accounts
4. Select a different account than previously used
5. **Expected:** App authenticates with selected account

**Success Criteria:**
- ✅ Account picker shows all accounts
- ✅ Can switch between accounts
- ✅ App uses the selected account

---

### Test 3: Account Already Signed In 🔐

**Goal:** Verify behavior when an account is already signed in

**Steps:**
1. Sign in with Google account A
2. Sign out from the app
3. Tap "Sign in with Google" again
4. **Expected:** Browser still shows account picker (not auto-selecting)
5. Select account A again
6. **Expected:** Authentication succeeds

**Success Criteria:**
- ✅ Account picker always shows (not auto-selecting)
- ✅ Can re-authenticate with same account
- ✅ No errors or crashes

---

### Test 4: Cancel/Back Button ⬅️

**Goal:** Verify graceful handling of user cancellation

**Steps:**
1. Tap "Sign in with Google"
2. Browser opens
3. Press back button or cancel
4. **Expected:** Browser closes, returns to app
5. **Expected:** App shows login screen (no error)

**Success Criteria:**
- ✅ No crashes on cancellation
- ✅ App returns to previous state
- ✅ Can retry sign-in

---

### Test 5: Network Error Handling 🌐

**Goal:** Verify error handling when network is unavailable

**Steps:**
1. Disable WiFi/mobile data
2. Tap "Sign in with Google"
3. **Expected:** Appropriate error message shown
4. Re-enable network
5. Retry sign-in
6. **Expected:** Sign-in succeeds

**Success Criteria:**
- ✅ Error message is user-friendly
- ✅ App doesn't crash
- ✅ Can retry after network restored

---

### Test 6: Deep Link Handling 🔗

**Goal:** Verify the app correctly handles the OAuth callback deep link

**Steps:**
1. Tap "Sign in with Google"
2. Complete authentication in browser
3. **Expected:** Deep link `https://balanze.cash/auth/callback` is handled
4. **Expected:** App opens automatically (if closed)
5. **Expected:** Authentication completes

**Success Criteria:**
- ✅ Deep link is recognized
- ✅ App opens from deep link
- ✅ Authentication completes successfully

---

## 🔍 Step 4: Debugging & Logs

### View Logs in Android Studio

1. Open **Logcat** in Android Studio
2. Filter by tags:
   - `GoogleSignIn` - Native plugin logs (if any)
   - `chromium` - WebView logs
   - `Console` - JavaScript console logs

### View Logs via ADB

```bash
# View all logs
adb logcat

# Filter for OAuth-related logs
adb logcat | grep -i "oauth\|auth\|callback"

# Filter for JavaScript console errors
adb logcat | grep -i "console\|error"
```

### Key Log Messages to Look For

**When Sign-In Starts:**
```
[OAUTH] ========== OAUTH FLOW STARTING ==========
[OAUTH] Provider: google
[OAUTH] Is Android platform? true
[OAUTH] 🌐 Android detected - using browser OAuth for reliable account picker
[OAUTH] 🔄 Using browser-based OAuth fallback...
[OAUTH] 🌐 Opening browser with OAuth URL...
[OAUTH] ✅ Browser opened successfully
```

**When Callback Received:**
```
[DEEPLINK] ========== DEEP LINK CALLBACK RECEIVED ==========
[DEEPLINK] 🔗 Full callback URL: https://balanze.cash/auth/callback#...
[AUTH_CALLBACK] ========== AUTH CALLBACK PAGE LOADED ==========
[AUTH_CALLBACK] ✅ No errors found in URL
[AUTH_CALLBACK] 🔄 Getting session from Supabase...
```

### Common Issues & Solutions

#### Issue 1: Browser Doesn't Open
**Symptoms:** Nothing happens when tapping "Sign in with Google"

**Debug Steps:**
1. Check Logcat for errors
2. Verify `Browser.open()` is being called
3. Check if browser app is installed on device

**Solution:**
- Ensure `@capacitor/browser` plugin is installed
- Check `npx cap sync android` was run
- Verify browser app exists on device

---

#### Issue 2: Deep Link Not Working
**Symptoms:** Browser redirects but app doesn't open

**Debug Steps:**
1. Check AndroidManifest.xml has intent-filter
2. Verify deep link URL matches exactly
3. Test deep link manually: `adb shell am start -a android.intent.action.VIEW -d "https://balanze.cash/auth/callback"`

**Solution:**
- Verify AndroidManifest.xml has correct intent-filter
- Check that `android:autoVerify="true"` is set
- Rebuild and reinstall app

---

#### Issue 3: Session Not Set
**Symptoms:** Callback received but user not authenticated

**Debug Steps:**
1. Check Logcat for session errors
2. Verify Supabase session is being set
3. Check if tokens are in the callback URL

**Solution:**
- Verify Supabase configuration
- Check redirect URL matches Supabase settings
- Ensure tokens are being parsed correctly

---

#### Issue 4: Account Picker Still Not Showing
**Symptoms:** Browser opens but auto-selects account

**Note:** This should NOT happen with browser OAuth, but if it does:

**Debug Steps:**
1. Check if using correct OAuth flow (browser, not native)
2. Verify `skipBrowserRedirect: true` is set
3. Check Supabase OAuth configuration

**Solution:**
- Ensure code is using `fallbackToBrowserOAuth`
- Verify Supabase OAuth settings allow account selection
- Check Google Cloud Console OAuth settings

---

## ✅ Step 5: Verification Checklist

After testing, verify:

- [ ] **Browser opens** when tapping "Sign in with Google"
- [ ] **Account picker shows** (even with single account)
- [ ] **Can select account** from picker
- [ ] **App receives callback** after authentication
- [ ] **User is authenticated** and redirected to dashboard
- [ ] **Multiple accounts** can be selected
- [ ] **Cancellation** is handled gracefully
- [ ] **Error messages** are user-friendly
- [ ] **Deep links** work correctly
- [ ] **No crashes** during any flow

## 📊 Expected Behavior Summary

| Scenario | Expected Behavior |
|----------|------------------|
| Single account on device | Account picker still shows |
| Multiple accounts | All accounts shown in picker |
| Already signed in | Account picker shows (not auto-selecting) |
| User cancels | Browser closes, app returns to login |
| Network error | User-friendly error message |
| Deep link callback | App opens and authenticates |

## 🎯 Success Criteria

The implementation is successful if:

1. ✅ **Account picker ALWAYS shows** (main goal achieved!)
2. ✅ **No crashes** during any flow
3. ✅ **User experience is smooth** (browser opens → select account → app authenticates)
4. ✅ **Deep links work** correctly
5. ✅ **Error handling** is graceful

## 🐛 Reporting Issues

If you encounter issues, collect:

1. **Logcat output** (filtered for OAuth/auth)
2. **Steps to reproduce**
3. **Device/Android version**
4. **Screenshots** (if applicable)
5. **Expected vs actual behavior**

## 📝 Next Steps After Testing

Once testing is complete:

1. **Document any issues** found
2. **Update this guide** with any new findings
3. **Consider production deployment** if all tests pass
4. **Monitor user feedback** after release

---

**Good luck with testing! 🚀**

If you need help during testing, check the logs first, then refer to the troubleshooting section above.

