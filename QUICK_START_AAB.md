# 🚀 Quick Start: Generate AAB for Play Store

## Step 1: Generate Keystore (First time only)

**Recommended (Cross-platform):**
```bash
npm run android:generate-keystore
```

**Or use platform-specific scripts:**

**On Windows:**
```bash
generate-keystore.bat
```

**On Mac/Linux:**
```bash
chmod +x generate-keystore.sh
./generate-keystore.sh
```

This creates `balanze-release-key.jks` with a secure password.

---

## Step 2: Build AAB

**On Windows:**
```bash
build-aab.bat
```

**On Mac/Linux:**
```bash
chmod +x build-aab.sh
./build-aab.sh
```

**Or use npm:**
```bash
npm run android:aab
```

---

## Step 3: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Your App → Release → Create new release
3. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
4. Fill release notes and publish

---

## 🔐 Generated Password

**Keystore Password:** `kksDK1yCifkbEtbCDYXXaDc3A1!`

This is stored in `android/keystore.properties` (already gitignored).

**⚠️ IMPORTANT:** 
- Keep `balanze-release-key.jks` secure
- Backup the keystore file
- Consider Play App Signing after first upload

---

## 📖 Full Guide

See `AAB_BUILD_GUIDE.md` for detailed instructions.

