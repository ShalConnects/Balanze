# ⚡ Quick Test Checklist - Android Browser OAuth

Use this as a quick reference during testing.

## 🚀 Quick Start Commands

```bash
# 1. Build and sync
npm run build
npx cap sync android

# 2. Open in Android Studio
npx cap open android

# 3. Or build from command line
cd android && ./gradlew assembleDebug
```

## ✅ Testing Checklist

### Pre-Flight Checks
- [ ] Code is built (`npm run build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] App installed on device/emulator
- [ ] Device has internet connection

### Test 1: Basic Flow (2 minutes)
- [ ] Open app → Tap "Sign in with Google"
- [ ] Browser opens with account picker
- [ ] Select account → App authenticates
- [ ] Redirected to dashboard

### Test 2: Account Picker (1 minute)
- [ ] Account picker shows (even with 1 account)
- [ ] Can see all accounts if multiple exist
- [ ] Can select different account

### Test 3: Cancel Flow (30 seconds)
- [ ] Tap "Sign in with Google"
- [ ] Press back/cancel in browser
- [ ] App returns to login (no crash)

### Test 4: Deep Link (1 minute)
- [ ] Complete sign-in in browser
- [ ] App opens automatically from deep link
- [ ] Authentication completes

## 🔍 Quick Debug Commands

```bash
# View logs
adb logcat | grep -i "oauth\|auth\|callback"

# Test deep link manually
adb shell am start -a android.intent.action.VIEW -d "https://balanze.cash/auth/callback"

# Check if app is installed
adb shell pm list packages | grep balanze
```

## 📊 Expected Logs

Look for these in Logcat:

```
[OAUTH] 🌐 Android detected - using browser OAuth
[OAUTH] 🌐 Opening browser with OAuth URL...
[DEEPLINK] DEEP LINK CALLBACK RECEIVED
[AUTH_CALLBACK] AUTH CALLBACK PAGE LOADED
```

## ❌ Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Browser doesn't open | Check `@capacitor/browser` installed |
| Deep link not working | Verify AndroidManifest.xml intent-filter |
| Session not set | Check Supabase redirect URL config |
| Account picker not showing | Should always show with browser OAuth |

## 🎯 Success = Account Picker Always Shows! ✅

That's the main goal - if the account picker shows every time, you're good!

---

**Full guide:** See `TEST_ANDROID_BROWSER_OAUTH.md` for detailed testing scenarios.

