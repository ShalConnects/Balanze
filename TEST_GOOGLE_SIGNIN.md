# ✅ Test Google Sign-In After SHA-1 Configuration

## What You've Done
- ✅ Got SHA-1 fingerprint from keystore
- ✅ Created/updated Android OAuth client in Google Cloud Console
- ✅ Waited 30 minutes for propagation

## Next Steps

### Step 1: Rebuild the App

**Option A: Full Clean Build (Recommended)**
```bash
# Clean build
cd android
.\gradlew clean
cd ..

# Sync Capacitor
npx cap sync android

# Build release APK
npm run android:build
```

**Option B: Quick Build**
```bash
npx cap sync android
npm run android:build
```

### Step 2: Install the New APK

Install the newly built APK on your Android device:
```bash
# If using adb
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Or manually transfer and install the APK file
```

### Step 3: Test Google Sign-In

1. **Open the app** on your Android device
2. **Tap "Sign in with Google"**
3. **You should see:**
   - Native Google account picker (not a browser!)
   - No DEVELOPER_ERROR
   - Successful sign-in

### Step 4: Check Logs (If Still Having Issues)

If you still get errors, check the logs:
```bash
adb logcat | grep GoogleSignIn
```

Look for:
- ✅ "GoogleSignInClient initialized successfully"
- ✅ "Sign-In intent started"
- ❌ Any error messages

## What to Expect

**Success:**
- Account picker appears
- You can select a Google account
- Sign-in completes successfully
- You're redirected to the dashboard

**If Still Getting DEVELOPER_ERROR:**
1. Double-check in Google Cloud Console:
   - Android OAuth client exists
   - Package name is exactly: `com.balanze.app`
   - SHA-1 fingerprint matches (no colons, uppercase)
   - Android OAuth client is in the SAME project as Web OAuth client

2. Wait another 10-15 minutes (sometimes takes longer)

3. Verify the Web Client ID in `capacitor.config.ts` matches Google Cloud Console

## Troubleshooting

### Error: "Sign in was cancelled"
- This is normal if you cancel the account picker
- Just try again

### Error: Still getting DEVELOPER_ERROR
- Check that both OAuth clients (Web and Android) are in the same Google Cloud project
- Verify SHA-1 is correct (no typos, no colons)
- Make sure package name is exactly `com.balanze.app` (case-sensitive)

### Error: "Network error"
- Check your internet connection
- Make sure Google Play Services is up to date on your device

---

**Ready to test?** Run the build commands above and install the new APK!

