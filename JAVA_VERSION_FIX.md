# 🔧 Java Version Fix for AAB Build

## Problem
You have **Java 24** installed, but **Gradle 8.13** doesn't support it yet. You need **Java 17** (LTS) to build the AAB.

## ✅ Solution Options

### **Option 1: Install Java 17 (Recommended)**

1. **Download Java 17:**
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Download Windows x64 installer
   - Install it (e.g., to `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`)

2. **Set JAVA_HOME temporarily for this build:**
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"
   # (Use your actual Java 17 path)
   ```

3. **Verify Java version:**
   ```powershell
   java -version
   # Should show: openjdk version "17.x.x"
   ```

4. **Build AAB:**
   ```powershell
   npm run android:aab
   ```

### **Option 2: Use Gradle Auto-Provisioning (If Available)**

Gradle can auto-download Java 17 if configured. Try:

```powershell
cd android
.\gradlew.bat bundleRelease --no-daemon
```

If this doesn't work, use Option 1.

### **Option 3: Use the Fixed Build Script**

I've created `build-aab-fixed.bat` which stops Gradle daemons first:

```powershell
.\build-aab-fixed.bat
```

---

## 🚀 Quick Fix (Temporary)

If you just want to build quickly, install Java 17 and run:

```powershell
# Set JAVA_HOME to Java 17 (adjust path as needed)
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"

# Verify
java -version

# Build
npm run android:aab
```

---

## 📝 Long-term Solution

For permanent setup, you can:

1. **Keep both Java versions** (24 for development, 17 for Android builds)
2. **Use a version manager** like:
   - [SDKMAN](https://sdkman.io/) (works on Windows with WSL)
   - [jEnv](https://www.jenv.be/) (Linux/Mac)
   - Or manually switch JAVA_HOME when needed

3. **Or set JAVA_HOME permanently** to Java 17 in Windows Environment Variables

---

## ✅ After Installing Java 17

Once Java 17 is installed and JAVA_HOME is set:

1. **Stop Gradle daemons:**
   ```powershell
   cd android
   .\gradlew.bat --stop
   ```

2. **Build AAB:**
   ```powershell
   cd ..
   npm run android:aab
   ```

---

## 🔍 Verify Java Version

Check which Java Gradle will use:

```powershell
cd android
.\gradlew.bat --version
```

This will show the Java version Gradle is using.

---

## 💡 Why Java 17?

- **Java 17** is the current LTS (Long Term Support) version
- **Gradle 8.13** supports Java 8 through Java 21
- **Java 24** is too new and not yet supported
- Most Android projects use Java 17 or Java 11

---

## 📚 Resources

- Download Java 17: https://adoptium.net/temurin/releases/?version=17
- Gradle Java Compatibility: https://docs.gradle.org/current/userguide/compatibility.html

