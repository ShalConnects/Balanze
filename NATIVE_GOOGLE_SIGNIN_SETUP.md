# Native Google Sign-In Setup for Android

## ✅ What Was Implemented

Your Android app now uses **native Google Sign-In SDK** instead of opening a browser. This provides a professional, seamless experience:

- ✅ **Native account picker** - No browser needed
- ✅ **Faster authentication** - Direct integration
- ✅ **Better UX** - Matches industry standards (like Gmail, YouTube apps)
- ✅ **More secure** - Uses Google's official SDK

## 📋 Setup Steps

### Step 1: Get Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (Web application type)
5. Copy the **Client ID** (it looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### Step 2: Configure Android App in Google Cloud Console

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Android** as the application type
4. Enter:
   - **Package name**: `com.balanze.app`
   - **SHA-1 certificate fingerprint**: Get this by running:
     ```bash
     keytool -list -v -keystore balanze-release-key.jks -alias balanze
     ```
     Look for the `SHA1:` value and copy it (remove colons)
5. Click **Create**
6. **Important**: Use the **same Client ID** for both Web and Android configurations

### Step 3: Set Environment Variable

Add your Google Client ID to your environment:

**For local development** (`.env.local`):
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**For production** (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: `your-google-client-id-here`
   - Environment: Production, Preview, Development

### Step 4: Sync Android Project

After setting the environment variable, sync your Android project:

```bash
npm run android:sync
```

Or manually:
```bash
npm run build
npx cap sync android
```

### Step 5: Build and Test

```bash
npm run android:build
```

Or for development:
```bash
npm run android:run
```

## 🔧 How It Works

1. **User taps "Sign in with Google"** on Android
2. **Native Google Sign-In SDK** shows account picker (no browser!)
3. **User selects account** → Google returns ID token
4. **App exchanges ID token** with Supabase
5. **User is authenticated** → Redirected to dashboard

## 🐛 Troubleshooting

### Error: "serverClientId not configured"

**Solution**: Make sure `VITE_GOOGLE_CLIENT_ID` is set in your environment and you've run `npx cap sync android` after setting it.

### Error: "Developer error: Check your server client ID configuration"

**Solution**: 
1. Verify the Client ID in `capacitor.config.ts` matches your Google Cloud Console Client ID
2. Make sure you've created an **Android** OAuth client in Google Cloud Console with your app's package name and SHA-1 fingerprint

### Error: "Sign in failed: 10"

**Solution**: This means the server client ID is incorrect. Double-check:
- The Client ID in `capacitor.config.ts` matches Google Cloud Console
- You've created an Android OAuth client (not just Web)
- The package name in Google Cloud Console matches `com.balanze.app`

### Native Sign-In Not Working?

The app will automatically fallback to browser-based OAuth if native sign-in fails. Check the logs:
- Look for `[OAUTH]` messages in Android logcat
- If you see "Native Google Sign-In not available", the plugin might not be registered correctly

## 📱 Testing

1. Build and install the app on an Android device
2. Tap "Sign in with Google"
3. You should see a **native Google account picker** (not a browser!)
4. Select your account
5. You should be signed in and redirected to the dashboard

## 🎯 What Changed

### Files Modified:
- ✅ `android/app/build.gradle` - Added Google Sign-In SDK dependency
- ✅ `android/app/src/main/java/com/balanze/app/GoogleSignInPlugin.java` - New native plugin
- ✅ `android/app/src/main/java/com/balanze/app/MainActivity.java` - Registered plugin
- ✅ `src/lib/googleSignIn.ts` - TypeScript interface for plugin
- ✅ `src/store/authStore.ts` - Updated to use native sign-in on Android
- ✅ `capacitor.config.ts` - Added Google Sign-In configuration

### How It Works:
- **Android**: Uses native Google Sign-In SDK (no browser)
- **Web/iOS**: Still uses browser-based OAuth (unchanged)

## ✨ Benefits

1. **Professional UX** - Native account picker like major apps
2. **Faster** - No browser loading time
3. **More secure** - Uses official Google SDK
4. **Better conversion** - Users trust native flows more
5. **Industry standard** - Matches how Gmail, YouTube, etc. do it

## 📚 Additional Resources

- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins)

---

**Note**: Make sure your Google OAuth Client ID is the same for both Web and Android configurations in Google Cloud Console. The native sign-in uses the Web Client ID but requires Android OAuth client to be configured for package verification.

