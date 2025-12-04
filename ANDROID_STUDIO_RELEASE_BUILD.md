# 🏗️ Build Release AAB in Android Studio

## Problem
Android Studio is building **debug** AAB instead of **release** AAB.

## Solution: Change Build Variant

### Step 1: Open Build Variants Panel

1. In Android Studio, look at the bottom left
2. Click on **"Build Variants"** tab (or go to **View → Tool Windows → Build Variants**)

### Step 2: Select Release Variant

1. Find **:app** module in the list
2. Change the **Active Build Variant** from **debug** to **release**
3. The dropdown should show:
   - ✅ **release** (select this)
   - ❌ debug (don't use this)

### Step 3: Build Release AAB

**Option A: Using Build Menu**
1. Go to **Build → Build Bundle(s) / APK(s) → Build Bundle(s)**
2. This will build the **release** bundle

**Option B: Using Gradle Panel**
1. Open **Gradle** panel (right side)
2. Navigate: **Balanze → android → Tasks → bundle**
3. Double-click **bundleRelease**
4. NOT **bundleDebug**

### Step 4: Find Your Release AAB

After building, the release AAB will be at:
```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## ✅ Verify It's Release

- ✅ File name: `app-release.aab` (not `app-debug.aab`)
- ✅ Location: `release\` folder (not `debug\`)
- ✅ File size: Should be larger than debug (includes optimizations)

---

## 🔄 Quick Switch

You can quickly switch between debug and release using the **Build Variants** panel. Always select **release** when building for Play Store.

---

## 📝 Note

- **Debug builds** are for testing only
- **Release builds** are signed and ready for Play Store
- Always use **release** variant for production uploads

