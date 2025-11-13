@echo off
REM Script to generate Android signing keystore for Balanze app
REM This keystore is required for Play Store uploads

echo 🔐 Generating Android signing keystore for Balanze...

REM Check if keystore.properties exists
if not exist "android\keystore.properties" (
    echo ❌ Error: android\keystore.properties not found!
    exit /b 1
)

REM Read password from keystore.properties
for /f "tokens=2 delims==" %%a in ('findstr /C:"storePassword=" android\keystore.properties') do set KEYSTORE_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"keyPassword=" android\keystore.properties') do set KEY_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"keyAlias=" android\keystore.properties') do set KEY_ALIAS=%%a

set KEYSTORE_FILE=balanze-release-key.jks

REM Check if keystore already exists
if exist "%KEYSTORE_FILE%" (
    echo ⚠️  Keystore already exists at %KEYSTORE_FILE%
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Cancelled.
        exit /b 0
    )
    del "%KEYSTORE_FILE%"
)

REM Generate keystore
keytool -genkey -v ^
    -keystore "%KEYSTORE_FILE%" ^
    -alias "%KEY_ALIAS%" ^
    -keyalg RSA ^
    -keysize 2048 ^
    -validity 10000 ^
    -storepass "%KEYSTORE_PASSWORD%" ^
    -keypass "%KEY_PASSWORD%" ^
    -dname "CN=Balanze, OU=Development, O=Balanze, L=Unknown, ST=Unknown, C=US"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Keystore generated successfully at %KEYSTORE_FILE%
    echo 📝 IMPORTANT: Keep this file and the password secure!
    echo 📝 The password is stored in android\keystore.properties (already gitignored)
) else (
    echo ❌ Error generating keystore
    exit /b 1
)

