@echo off
REM Script to build Android App Bundle (AAB) with Java 17 compatibility
REM This script stops Gradle daemon and rebuilds with proper Java version

echo 🚀 Building Android App Bundle (AAB) for Balanze...
echo.

REM Step 1: Stop any running Gradle daemons (they might be using Java 24)
echo 🔄 Step 1: Stopping Gradle daemons...
cd android
call gradlew.bat --stop
cd ..

REM Step 2: Build web assets
echo 📦 Step 2: Building web assets...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Web build failed!
    exit /b 1
)

REM Step 3: Sync Capacitor
echo 🔄 Step 3: Syncing Capacitor...
call npx cap sync android

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Capacitor sync failed!
    exit /b 1
)

REM Step 4: Check if keystore exists
if not exist "balanze-release-key.jks" (
    echo ❌ Error: Keystore not found!
    echo 📝 Please run: npm run android:generate-keystore
    exit /b 1
)

REM Step 5: Build AAB with Java 17 toolchain
echo 🔨 Step 4: Building signed AAB...
echo ⚠️  Note: If you see Java version errors, you may need to install Java 17
echo    Download from: https://adoptium.net/temurin/releases/?version=17
echo.

cd android
call gradlew.bat bundleRelease -Dorg.gradle.java.home=""

if %ERRORLEVEL% EQU 0 (
    cd ..
    set AAB_PATH=android\app\build\outputs\bundle\release\app-release.aab
    if exist "%AAB_PATH%" (
        echo.
        echo ✅ AAB built successfully!
        echo 📦 Location: %AAB_PATH%
        echo.
        echo 🎯 Next steps:
        echo    1. Upload %AAB_PATH% to Google Play Console
        echo    2. Go to: Play Console ^> Your App ^> Release ^> Production/Testing
        echo    3. Create a new release and upload the AAB file
    ) else (
        echo ❌ Error: AAB file not found at expected location
        exit /b 1
    )
) else (
    cd ..
    echo.
    echo ❌ Error: AAB build failed!
    echo.
    echo 💡 Solution: Install Java 17 and set JAVA_HOME:
    echo    1. Download Java 17 from: https://adoptium.net/temurin/releases/?version=17
    echo    2. Install it (e.g., to C:\Program Files\Java\jdk-17)
    echo    3. Set JAVA_HOME temporarily:
    echo       set JAVA_HOME=C:\Program Files\Java\jdk-17
    echo    4. Run this script again
    exit /b 1
)

