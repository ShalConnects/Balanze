# 🔗 Android App Links Setup (Google Play Compliant)

This is the **official Google-recommended solution** that works with ALL browsers (Chrome, Brave, Firefox, etc.) and is fully compliant with Google Play policies.

## ✅ What This Does

- Enables automatic deep linking from ANY browser
- Works with Chrome, Brave, Firefox, Edge, etc.
- Fully compliant with Google Play policies
- No custom URL schemes needed

## 📋 Step 1: Get Your App's SHA-256 Fingerprint

Run this command in your project root:

```bash
keytool -list -v -keystore balanze-release-key.jks -alias balanze
```

**When prompted, enter your keystore password.**

Look for the line that says:
```
SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the SHA256 value** (remove the colons, keep only the hex characters).

## 📋 Step 2: Create assetlinks.json File

Create a file at: `public/.well-known/assetlinks.json` (or `dist/.well-known/assetlinks.json` if deploying to Vercel)

Replace `YOUR_SHA256_FINGERPRINT` with the fingerprint you got from Step 1:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.balanze.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

**Example:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.balanze.app",
      "sha256_cert_fingerprints": [
        "A1:B2:C3:D4:E5:F6:...:XX"
      ]
    }
  }
]
```

## 📋 Step 3: Deploy to Your Website

### Option A: Vercel Deployment

1. Create the file: `public/.well-known/assetlinks.json`
2. Commit and push to your repository
3. Vercel will automatically serve it at: `https://balanze.cash/.well-known/assetlinks.json`

### Option B: Manual Deployment

Upload the file to your web server at:
```
https://balanze.cash/.well-known/assetlinks.json
```

**Important:** The file MUST be:
- ✅ Accessible via HTTPS
- ✅ Served with `Content-Type: application/json`
- ✅ Returns HTTP 200 status code

## 📋 Step 4: Verify It Works

1. Visit: `https://balanze.cash/.well-known/assetlinks.json`
2. You should see the JSON file in your browser
3. Use Google's verification tool: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://balanze.cash&relation=delegate_permission/common.handle_all_urls

## 📋 Step 5: Test on Device

1. Install your app on an Android device
2. Open Brave (or any browser)
3. Navigate to: `https://balanze.cash/auth/callback?test=1`
4. The app should automatically open (or show a dialog asking which app to use)

## 🔍 Troubleshooting

### If deep link doesn't work:

1. **Check file is accessible:**
   ```bash
   curl https://balanze.cash/.well-known/assetlinks.json
   ```

2. **Verify SHA-256 fingerprint matches:**
   - Make sure you're using the **release** keystore fingerprint
   - Not the debug keystore fingerprint

3. **Clear app data:**
   - Settings → Apps → Balanze → Storage → Clear Data
   - Reinstall the app

4. **Check Android verification:**
   ```bash
   adb shell pm get-app-links com.balanze.app
   ```

## ✅ Benefits

- ✅ Works with ALL browsers (not just Chrome)
- ✅ Fully compliant with Google Play policies
- ✅ Automatic deep linking (no user prompt)
- ✅ Secure (verified by Google)
- ✅ No code changes needed (already configured in AndroidManifest.xml)

