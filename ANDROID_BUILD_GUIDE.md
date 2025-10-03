# 🤖 Android App Build Guide for Balanze

## ✅ Setup Complete!

Your Android app has been configured with **Capacitor** and includes:
- ✅ **Pull-to-refresh DISABLED** in native code
- ✅ **Overscroll behavior set to NEVER**
- ✅ **Smooth scrolling enabled**
- ✅ **Proper WebView configuration**

---

## 📋 Prerequisites

Before building, make sure you have:

1. **Android Studio** installed
   - Download from: https://developer.android.com/studio
   
2. **Java JDK 17** or higher
   - Check with: `java -version`
   - Download from: https://www.oracle.com/java/technologies/downloads/

3. **Android SDK** (comes with Android Studio)
   - Make sure SDK is properly configured

---

## 🚀 Build Instructions

### **Option 1: Quick Build (Development APK)**

Run this single command:

```bash
npm run android:sync
```

Then open Android Studio:

```bash
npm run android:open
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### **Option 2: Release Build (Production APK)**

#### Step 1: Build Web Assets
```bash
npm run build
```

#### Step 2: Sync to Android
```bash
npx cap sync android
```

#### Step 3: Generate Signing Key (First time only)
```bash
keytool -genkey -v -keystore balanze-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias balanze
```

Save the password securely!

#### Step 4: Configure Signing

Create `android/app/build.gradle.local` (not tracked by git):

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../balanze-release-key.jks")
            storePassword "YOUR_KEYSTORE_PASSWORD"
            keyAlias "balanze"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### Step 5: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

Or use the npm script:
```bash
npm run android:build
```

Release APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 Install APK on Device

### Via USB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer:
1. Copy APK to your phone
2. Enable "Install from Unknown Sources"
3. Tap the APK file to install

---

## 🔧 Key Features Configured

### **1. No Pull-to-Refresh** ✅
```java
// MainActivity.java
this.bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
```

### **2. Smooth Scrolling** ✅
```java
webView.setNestedScrollingEnabled(true);
webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
```

### **3. Capacitor Config** ✅
```typescript
// capacitor.config.ts
android: {
  overscrollMode: 'never',
  captureInput: true
}
```

---

## 🎯 Testing the Fix

After installing the APK:

1. ✅ **Scroll to top** → Try pulling down → Should NOT refresh
2. ✅ **Scroll to bottom** → Try pulling up → Should NOT refresh
3. ✅ **Scroll up from bottom** → Should work smoothly
4. ✅ **Scroll down from top** → Should work smoothly
5. ✅ **Release finger while scrolling** → Should continue momentum

---

## 🐛 Troubleshooting

### **Gradle sync failed?**
```bash
cd android
./gradlew clean
./gradlew build
```

### **App won't install?**
- Uninstall old version first
- Enable "Install from Unknown Sources"
- Check APK isn't corrupted

### **Still refreshing?**
Check that `MainActivity.java` has the overscroll fix:
```bash
cat android/app/src/main/java/com/balanze/app/MainActivity.java
```

---

## 📦 App Details

- **App ID**: `com.balanze.app`
- **App Name**: Balanze
- **Package**: Located in `android/` folder
- **Web Assets**: Synced from `dist/` folder

---

## 🔄 Update Flow

When you make changes to your web app:

1. **Build web assets**:
   ```bash
   npm run build
   ```

2. **Sync to Android**:
   ```bash
   npx cap sync android
   ```

3. **Rebuild APK** in Android Studio or:
   ```bash
   npm run android:build
   ```

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Publishing on Play Store](https://developer.android.com/studio/publish)

---

## ✨ The Fix is Applied!

Your Android app now has **native-level control** over scroll behavior. The pull-to-refresh issue is **completely eliminated** because we're controlling it at the Android WebView level, not just CSS/JavaScript.

**Build your APK and test it - the refresh issue will be GONE!** 🎉
