# ⚡ Quick Fix: Install Java 17

## Current Problem
- ❌ Java 17 is **NOT installed**
- ❌ JAVA_HOME is set to a non-existent path
- ✅ Java 24 is installed, but Gradle 8.13 doesn't support it

## Solution: Install Java 17

### Step 1: Download Java 17

**Direct Download Link:**
👉 https://adoptium.net/temurin/releases/?version=17

**Steps:**
1. Click the link above
2. Select: **Windows x64**
3. Select: **JDK** (not JRE)
4. Select: **.msi installer** (easiest option)
5. Click **Download**

### Step 2: Install

1. Run the downloaded `.msi` file
2. Follow the installer:
   - ✅ **Check "Set JAVA_HOME variable"** (important!)
   - ✅ **Check "Add to PATH"** (optional but helpful)
   - Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`)

### Step 3: Verify Installation

**Close and reopen PowerShell**, then:

```powershell
# Check Java version
java -version
# Should show: openjdk version "17.x.x"

# Check JAVA_HOME (if set automatically)
echo $env:JAVA_HOME
# Should show: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

### Step 4: If JAVA_HOME Not Set Automatically

Find your Java 17 installation:

```powershell
# List Java installations
Get-ChildItem "C:\Program Files\Eclipse Adoptium\" | Select-Object Name
```

Then set JAVA_HOME:

```powershell
# Replace with your actual path from above
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"

# Verify
echo $env:JAVA_HOME
java -version
```

### Step 5: Build AAB

```powershell
# Stop any Gradle daemons
cd android
.\gradlew.bat --stop
cd ..

# Build AAB
npm run android:aab
```

---

## Alternative: Portable ZIP (No Installer)

If you prefer not to use an installer:

1. Download: https://adoptium.net/temurin/releases/?version=17
2. Select: **Windows x64** → **JDK** → **.zip**
3. Extract to: `C:\Java\jdk-17` (or any location)
4. Set JAVA_HOME:
   ```powershell
   $env:JAVA_HOME="C:\Java\jdk-17"
   $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
   ```
5. Verify: `java -version`

---

## ⚠️ Important Notes

1. **You MUST install Java 17** - Gradle 8.13 doesn't support Java 24
2. **JAVA_HOME must point to the JDK folder** (not bin folder)
   - ✅ Correct: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot`
   - ❌ Wrong: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot\bin`
3. **Close and reopen PowerShell** after installation to refresh environment variables

---

## 🔍 Troubleshooting

**"JAVA_HOME is set to an invalid directory"**
- Java 17 is not installed at that path
- Install Java 17 first (see Step 1-2 above)
- Or unset JAVA_HOME: `$env:JAVA_HOME = $null`

**"java -version still shows Java 24"**
- Java 24 is earlier in your PATH
- Set JAVA_HOME and add to PATH:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"
  $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
  java -version  # Should now show Java 17
  ```

**"Gradle still uses Java 24"**
- Stop daemons: `cd android && .\gradlew.bat --stop`
- Verify JAVA_HOME: `echo $env:JAVA_HOME`
- Rebuild: `npm run android:aab`

---

## 📥 Download Now

**👉 https://adoptium.net/temurin/releases/?version=17**

Choose: **Windows x64** → **JDK** → **.msi installer**

