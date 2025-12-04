@echo off
REM Script to build Android App Bundle (AAB) for Play Store upload
REM This generates a signed AAB file ready for Google Play Store

echo 🚀 Building Android App Bundle (AAB) for Balanze...

REM Step 1: Build web assets
echo 📦 Step 1: Building web assets...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Web build failed!
    exit /b 1
)

REM Step 2: Sync Capacitor
echo 🔄 Step 2: Syncing Capacitor...
call npx cap sync android

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Capacitor sync failed!
    exit /b 1
)

REM Step 3: Check if keystore exists
if not exist "balanze-release-key.jks" (
    echo ❌ Error: Keystore not found!
    echo 📝 Please run generate-keystore.bat first to create the signing key
    exit /b 1
)

REM Step 4: Build AAB
echo 🔨 Step 3: Building signed AAB...
cd android
call gradlew.bat bundleRelease

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
        echo.
        echo 💡 Tip: Consider opting into Play App Signing for better security
    ) else (
        echo ❌ Error: AAB file not found at expected location
        exit /b 1
    )
) else (
    cd ..
    echo ❌ Error: AAB build failed!
    exit /b 1
)

