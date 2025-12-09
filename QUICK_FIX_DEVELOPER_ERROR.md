# ⚡ Quick Fix: Android DEVELOPER_ERROR (Status Code 10)

## 🎯 The Problem
```
DEVELOPER_ERROR: Check server client ID configuration. Status code: 10
```

## ✅ The Solution (3 Steps)

### Step 1: Get SHA-1 Fingerprint

**Run this command:**
```powershell
.\get-sha1-fingerprint.ps1
```

Or manually:
```bash
keytool -list -v -keystore balanze-release-key.jks -alias balanze
```

**Copy the SHA-1 value** (remove all colons `:`)

Example: `A1:B2:C3:D4:...` → `A1B2C3D4...`

### Step 2: Create Android OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
3. Choose **"Android"**
4. Enter:
   - **Package name**: `com.balanze.app`
   - **SHA-1**: [paste your SHA-1 WITHOUT colons]
5. Click **"CREATE"**

⚠️ **IMPORTANT**: Must be in the **same project** as your Web OAuth client!

### Step 3: Rebuild and Test

```bash
npx cap sync android
npm run android:build
```

Install the new APK and test again.

## ✅ Done!

The error should be fixed. If not, see `FIX_ANDROID_DEVELOPER_ERROR.md` for detailed troubleshooting.

