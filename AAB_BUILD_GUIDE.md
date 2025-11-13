# 📦 Android App Bundle (AAB) Build Guide for Play Store

This guide will help you generate a signed AAB file ready for Google Play Store upload.

## 🎯 Overview

**What is an AAB?**
- Android App Bundle (AAB) is the required format for Play Store uploads
- Google Play generates optimized APKs from your AAB for different device configurations
- Smaller download sizes for users

**Signing Strategy:**
- ✅ **Recommended**: Use **Play App Signing** (Google manages your key)
- 🔐 **Current Setup**: Local signing (you manage the key) - can switch to Play App Signing later

---

## 📋 Prerequisites

1. **Java JDK 17+** installed
   - Check: `java -version`
   - Download: https://www.oracle.com/java/technologies/downloads/

2. **Android SDK** installed (comes with Android Studio)
   - Make sure `keytool` is in your PATH

3. **Keystore file** (we'll generate this)

---

## 🚀 Step-by-Step Instructions

### **Step 1: Generate Signing Keystore** (First time only)

#### On Windows:
```bash
generate-keystore.bat
```

#### On Mac/Linux:
```bash
chmod +x generate-keystore.sh
./generate-keystore.sh
```

#### Or use npm script:
```bash
npm run android:generate-keystore
```

This will create `balanze-release-key.jks` in your project root.

**⚠️ IMPORTANT:**
- The keystore password is stored in `android/keystore.properties` (already gitignored)
- **Keep the keystore file secure!** If you lose it, you cannot update your app on Play Store
- **Backup the keystore file** to a secure location

---

### **Step 2: Build the AAB**

#### On Windows:
```bash
build-aab.bat
```

#### On Mac/Linux:
```bash
chmod +x build-aab.sh
./build-aab.sh
```

#### Or use npm script:
```bash
npm run android:aab
```

This will:
1. ✅ Build your web assets (`npm run build`)
2. ✅ Sync Capacitor (`npx cap sync android`)
3. ✅ Build signed AAB (`./gradlew bundleRelease`)

**Output Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### **Step 3: Upload to Play Store**

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to: **Release** → **Production** (or **Testing**)
4. Click **Create new release**
5. Upload the AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes
7. Review and publish

---

## 🔐 Signing Configuration

### **Current Setup (Local Signing)**

Your app is configured for **local signing**:
- Keystore: `balanze-release-key.jks` (project root)
- Password: Stored in `android/keystore.properties`
- Configuration: `android/app/build.gradle`

### **Switching to Play App Signing (Recommended)**

After your first upload, you can opt into **Play App Signing**:

1. **Upload your first AAB** (with local signing)
2. In Play Console, go to: **App Integrity** → **App Signing**
3. Click **Opt in to Play App Signing**
4. Upload your keystore file (`balanze-release-key.jks`)
5. Google will manage signing for all future releases

**Benefits:**
- ✅ Google securely stores your key
- ✅ If you lose your key, Google can still sign updates
- ✅ Better security (Google's infrastructure)
- ✅ Can use upload keys (less critical if lost)

---

## 📝 Version Management

Update version before each release in `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2        // Increment for each release (integer)
    versionName "1.1"   // User-visible version (string)
}
```

**Rules:**
- `versionCode`: Must increase with each release (1, 2, 3, ...)
- `versionName`: Can be any string (1.0, 1.1, 2.0, etc.)

---

## 🔧 Troubleshooting

### **Error: Keystore not found**
```bash
# Make sure you've generated the keystore first
generate-keystore.bat  # or .sh
```

### **Error: keytool not found**
- Make sure Java JDK is installed
- Add Java bin directory to your PATH
- Or use full path: `"C:\Program Files\Java\jdk-17\bin\keytool.exe"`

### **Error: Gradle build failed**
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### **Error: Signing config not found**
- Check that `android/keystore.properties` exists
- Verify the keystore file path in `keystore.properties`
- Make sure `balanze-release-key.jks` exists in project root

### **AAB file not signed**
- Check that `android/keystore.properties` exists
- Verify signing config in `android/app/build.gradle`
- Make sure keystore file exists at the path specified

---

## 📦 File Structure

```
Balanze/
├── balanze-release-key.jks          # ⚠️ KEEP SECURE (gitignored)
├── android/
│   ├── keystore.properties          # ⚠️ KEEP SECURE (gitignored)
│   └── app/
│       └── build.gradle             # Signing configuration
└── android/app/build/outputs/bundle/release/
    └── app-release.aab              # ✅ Upload this to Play Store
```

---

## 🔒 Security Best Practices

1. **Never commit keystore files to git**
   - ✅ Already added to `.gitignore`
   - ✅ `*.jks`, `*.keystore`, `keystore.properties` are ignored

2. **Backup your keystore**
   - Store `balanze-release-key.jks` in a secure location
   - Consider using a password manager for the password

3. **Use Play App Signing**
   - Upload your keystore to Google after first release
   - Google manages it securely

4. **Keep passwords secure**
   - Password is in `android/keystore.properties` (gitignored)
   - Don't share the keystore file or password

---

## 📚 Additional Resources

- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

---

## ✅ Quick Reference

**Generate keystore:**
```bash
npm run android:generate-keystore
# or
generate-keystore.bat  # Windows
./generate-keystore.sh # Mac/Linux
```

**Build AAB:**
```bash
npm run android:aab
# or
build-aab.bat  # Windows
./build-aab.sh # Mac/Linux
```

**AAB Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🎉 You're Ready!

Your app is now configured to build signed AAB files for Play Store upload. 

**Next Steps:**
1. Generate keystore (if not done)
2. Build AAB
3. Upload to Play Console
4. Consider opting into Play App Signing

Good luck with your Play Store release! 🚀

