# 🔧 Set JAVA_HOME in Command Prompt

## ✅ Good News!
Java 17 is installed and working! (`openjdk version "17.0.17"`)

## Find Java 17 Installation Path

Since you're using **Command Prompt** (not PowerShell), use these commands:

### Method 1: Check Common Locations

```cmd
dir "C:\Program Files\Eclipse Adoptium"
dir "C:\Program Files\Java"
dir "C:\Program Files (x86)\Java"
```

Look for a folder like `jdk-17.0.17` or `jdk-17.x.x`.

### Method 2: Use Java to Find It

```cmd
java -XshowSettings:properties -version 2>&1 | findstr "java.home"
```

This will show where Java is running from. The path should be something like:
- `C:\Program Files\Eclipse Adoptium\jdk-17.0.17+10-hotspot`
- `C:\Program Files\Java\jdk-17.0.17`

**Note:** JAVA_HOME should point to the **JDK folder** (not the `bin` folder inside it).

## Set JAVA_HOME in Command Prompt

Once you find the path, set it:

```cmd
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17+10-hotspot
```

(Replace with your actual path)

## Verify

```cmd
echo %JAVA_HOME%
java -version
```

## Build AAB

Navigate to your project and build:

```cmd
cd C:\Users\salau\Downloads\Projects\Balanze
cd android
gradlew.bat --stop
cd ..
npm run android:aab
```

---

## Alternative: Set JAVA_HOME Permanently

To set JAVA_HOME permanently (so you don't have to set it every time):

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to **Advanced** tab → **Environment Variables**
3. Under **User variables** (or **System variables**), click **New**
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17+10-hotspot` (your actual path)
6. Click **OK** on all dialogs
7. **Close and reopen** Command Prompt

---

## Quick Test

Run this to find Java 17:

```cmd
for /d %i in ("C:\Program Files\Eclipse Adoptium\*") do @echo %i
for /d %i in ("C:\Program Files\Java\*") do @echo %i
```

This will list all Java installations in those folders.

