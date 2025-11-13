# 📥 Install Java 17 for Android Build

## Quick Install Steps

### Option 1: Download and Install (Recommended)

1. **Download Java 17:**
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Select: **Windows x64** → **JDK** → **.msi installer**
   - Download the file (e.g., `OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.msi`)

2. **Install:**
   - Run the downloaded `.msi` file
   - Follow the installer (default location: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot`)
   - ✅ Check "Set JAVA_HOME variable" during installation

3. **Verify Installation:**
   ```powershell
   # Close and reopen PowerShell, then:
   java -version
   # Should show: openjdk version "17.x.x"
   ```

4. **If JAVA_HOME wasn't set automatically:**
   ```powershell
   # Find your Java 17 installation path
   Get-ChildItem "C:\Program Files\Eclipse Adoptium\" | Select-Object Name
   
   # Set JAVA_HOME (replace with your actual path)
   $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"
   
   # Add to PATH for this session
   $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
   ```

5. **Build AAB:**
   ```powershell
   cd android
   .\gradlew.bat --stop
   cd ..
   npm run android:aab
   ```

---

### Option 2: Use Chocolatey (If Installed)

```powershell
choco install temurin17
```

Then set JAVA_HOME:
```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"
```

---

### Option 3: Portable ZIP (No Installer)

1. Download: https://adoptium.net/temurin/releases/?version=17
2. Select: **Windows x64** → **JDK** → **.zip**
3. Extract to: `C:\Java\jdk-17`
4. Set JAVA_HOME:
   ```powershell
   $env:JAVA_HOME="C:\Java\jdk-17"
   $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
   ```

---

## ✅ After Installation

1. **Stop Gradle daemons:**
   ```powershell
   cd android
   .\gradlew.bat --stop
   ```

2. **Verify Java 17:**
   ```powershell
   java -version
   # Should show: openjdk version "17.x.x"
   ```

3. **Build AAB:**
   ```powershell
   cd ..
   npm run android:aab
   ```

---

## 🔍 Troubleshooting

**If `java -version` still shows Java 24:**
- Java 24 is earlier in your PATH
- Set JAVA_HOME and add it to PATH:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11-hotspot"
  $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
  java -version  # Should now show Java 17
  ```

**If Gradle still uses Java 24:**
- Stop all daemons: `cd android && .\gradlew.bat --stop`
- Verify JAVA_HOME: `echo $env:JAVA_HOME`
- Rebuild: `npm run android:aab`

---

## 📚 Download Link

**Direct Download:** https://adoptium.net/temurin/releases/?version=17

Choose: **Windows x64** → **JDK** → **.msi installer**

