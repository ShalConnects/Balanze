# 🔧 Fix Android DEVELOPER_ERROR (Status Code 10)

## ❌ The Problem

You're getting this error when trying to sign in with Google on Android:
```
DEVELOPER_ERROR: Check server client ID configuration. Status code: 10
```

This error occurs because **Google requires an Android OAuth client to be configured** in your Google Cloud Console, even though you're using a Web Client ID for `requestIdToken()`.

## ✅ The Solution

You need to create an **Android OAuth client** in Google Cloud Console with:
1. ✅ Correct package name: `com.balanze.app`
2. ✅ Correct SHA-1 fingerprint from your signing keystore
3. ✅ Must be in the **same Google Cloud project** as your Web OAuth client

## 📋 Step-by-Step Fix

### Step 1: Get Your SHA-1 Fingerprint

**Option A: Use the PowerShell Script (Recommended)**

Run this in your project root:
```powershell
.\get-sha1-fingerprint.ps1
```

The script will:
- Prompt you for your keystore password
- Display your SHA-1 fingerprint (with and without colons)
- Show you exactly what to do next

**Option B: Manual Method**

Run this command:
```bash
keytool -list -v -keystore balanze-release-key.jks -alias balanze
```

When prompted, enter your keystore password.

Look for the line that says:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the SHA-1 value and remove all colons** (Google Cloud Console needs it without colons).

### Step 2: Create Android OAuth Client in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (the same one where your Web OAuth client is)

2. **Navigate to Credentials**
   - Go to **APIs & Services** → **Credentials**
   - You should see your existing Web OAuth client here

3. **Create Android OAuth Client**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
   - Choose **"Android"** as the application type
   - Fill in:
     - **Name**: `Balanze Android` (or any name you prefer)
     - **Package name**: `com.balanze.app`
     - **SHA-1 certificate fingerprint**: Paste your SHA-1 fingerprint (WITHOUT colons)
   - Click **"CREATE"**

4. **Verify Configuration**
   - You should now see TWO OAuth clients:
     - One for **Web application** (your existing one)
     - One for **Android** (the new one you just created)
   - Both should be in the **same project**

### Step 3: Verify Your Web Client ID

Make sure your `capacitor.config.ts` has the correct Web Client ID:

```typescript
GoogleSignIn: {
  serverClientId: "684747632135-l7g9s4u1ka3tbjll9eu0avga2jmcs7m1.apps.googleusercontent.com"
}
```

This should match your **Web OAuth client** in Google Cloud Console.

### Step 4: Rebuild and Test

After configuring the Android OAuth client:

1. **Sync Capacitor** (if you changed config):
   ```bash
   npx cap sync android
   ```

2. **Rebuild the app**:
   ```bash
   npm run android:build
   ```

3. **Install and test**:
   - Install the new APK/AAB on your device
   - Try signing in with Google
   - The error should be gone!

## 🔍 Why This Happens

When you use `requestIdToken()` with a Web Client ID, Google's authentication system requires:

1. ✅ **Web OAuth Client** - Used for the ID token (what you pass to `requestIdToken()`)
2. ✅ **Android OAuth Client** - Used to verify the app's identity (package name + SHA-1)

Both must exist in the **same Google Cloud project** for the authentication to work.

## 🐛 Common Issues

### Issue: "I already have an Android OAuth client"

**Check:**
- Does it have the correct package name? (`com.balanze.app`)
- Does it have the correct SHA-1 fingerprint? (Must match your signing keystore)
- Is it in the same project as your Web OAuth client?

**Solution:** Update the existing Android OAuth client or create a new one with the correct values.

### Issue: "I can't find my keystore password"

**Solution:**
- Check your password manager
- Check your project documentation
- If you lost it, you'll need to create a new keystore (but this will break your app updates on Google Play)

### Issue: "The error persists after configuration"

**Check:**
1. ✅ Did you wait a few minutes? (Google Cloud changes can take 5-10 minutes to propagate)
2. ✅ Did you rebuild the app with the new configuration?
3. ✅ Is the SHA-1 fingerprint correct? (No colons, all uppercase)
4. ✅ Is the package name exactly `com.balanze.app`? (No typos)
5. ✅ Are both OAuth clients in the same Google Cloud project?

**Solution:** Double-check all values and wait a few minutes, then try again.

### Issue: "I'm using a debug keystore for testing"

**For Debug Builds:**
- You need to get the SHA-1 from your **debug keystore** (usually at `~/.android/debug.keystore`)
- Create a separate Android OAuth client with the debug SHA-1
- Or use the release keystore SHA-1 if you're testing with a release build

**Get debug SHA-1:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 📚 Additional Resources

- [Google Sign-In for Android - Setup](https://developers.google.com/identity/sign-in/android/start-integrating)
- [OAuth 2.0 Client IDs - Android](https://support.google.com/cloud/answer/6158849?hl=en#android)
- [Getting SHA-1 Fingerprint](https://developers.google.com/android/guides/client-auth)

## ✅ Verification Checklist

Before testing, make sure:

- [ ] SHA-1 fingerprint is correct (no colons, uppercase)
- [ ] Package name is exactly `com.balanze.app`
- [ ] Android OAuth client exists in Google Cloud Console
- [ ] Android OAuth client is in the same project as Web OAuth client
- [ ] `capacitor.config.ts` has the correct Web Client ID
- [ ] App has been rebuilt after configuration
- [ ] Waited 5-10 minutes after creating OAuth client (for propagation)

---

**Still having issues?** Check the Android logcat for more detailed error messages:
```bash
adb logcat | grep GoogleSignIn
```

