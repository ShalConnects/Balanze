# 📦 Build Release AAB for Play Store

## ❌ Problem
You uploaded `app-debug.aab` which is a **debug** build. Play Store requires a **release** build signed with your release keystore.

## ✅ Solution: Build Release AAB

### Step 1: Stop Gradle Daemons
```cmd
cd C:\Users\salau\Downloads\Projects\Balanze\android
gradlew.bat --stop
```

### Step 2: Build Release AAB

**Option A: Using Gradle directly (Recommended)**
```cmd
cd C:\Users\salau\Downloads\Projects\Balanze\android
gradlew.bat bundleRelease
```

**Option B: Using npm script**
```cmd
cd C:\Users\salau\Downloads\Projects\Balanze
npm run android:aab
```

### Step 3: Find Your Release AAB

The **release** AAB will be at:
```
android\app\build\outputs\bundle\release\app-release.aab
```

**NOT** at:
- ❌ `android\app\build\outputs\bundle\debug\app-debug.aab` (this is debug)

---

## 🔍 How to Tell the Difference

**Debug AAB:**
- Location: `android\app\build\outputs\bundle\debug\app-debug.aab`
- Not signed with release keystore
- ❌ Cannot be uploaded to Play Store

**Release AAB:**
- Location: `android\app\build\outputs\bundle\release\app-release.aab`
- Signed with your release keystore (`balanze-release-key.jks`)
- ✅ Ready for Play Store upload

---

## ✅ Verify It's a Release Build

After building, check the file:
- ✅ Should be named: `app-release.aab`
- ✅ Should be in: `android\app\build\outputs\bundle\release\`
- ✅ Should be signed (you can verify with `jarsigner` if needed)

---

## 🚀 Upload to Play Store

1. Go to Google Play Console
2. Your App → Release → Production (or Testing)
3. Create new release
4. Upload: `android\app\build\outputs\bundle\release\app-release.aab`
5. Fill in release notes
6. Review and publish

---

## ⚠️ Important Notes

1. **Always build `bundleRelease`** - not `bundleDebug`
2. **Make sure keystore exists** - `balanze-release-key.jks` in project root
3. **Check keystore.properties** - should exist at `android/keystore.properties`
4. **Release AAB is signed** - automatically signed during build

---

## 🔧 Troubleshooting

**"Keystore not found"**
- Make sure `balanze-release-key.jks` exists in project root
- Run: `npm run android:generate-keystore` if missing

**"Signing config not found"**
- Check `android/keystore.properties` exists
- Verify keystore path in that file

**Still getting debug AAB**
- Make sure you're running `bundleRelease`, not `bundleDebug`
- Check the output path: should be `release/` not `debug/`

