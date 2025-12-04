#!/bin/bash

# Script to generate Android signing keystore for Balanze app
# This keystore is required for Play Store uploads

echo "🔐 Generating Android signing keystore for Balanze..."

# Load password from keystore.properties
if [ -f "android/keystore.properties" ]; then
    source <(grep -E "^storePassword=" android/keystore.properties | sed 's/storePassword=/export KEYSTORE_PASSWORD=/')
    source <(grep -E "^keyPassword=" android/keystore.properties | sed 's/keyPassword=/export KEY_PASSWORD=/')
    source <(grep -E "^keyAlias=" android/keystore.properties | sed 's/keyAlias=/export KEY_ALIAS=/')
else
    echo "❌ Error: android/keystore.properties not found!"
    exit 1
fi

KEYSTORE_FILE="balanze-release-key.jks"

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore already exists at $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    rm "$KEYSTORE_FILE"
fi

# Generate keystore
keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=Balanze, OU=Development, O=Balanze, L=Unknown, ST=Unknown, C=US"

if [ $? -eq 0 ]; then
    echo "✅ Keystore generated successfully at $KEYSTORE_FILE"
    echo "📝 IMPORTANT: Keep this file and the password secure!"
    echo "📝 The password is stored in android/keystore.properties (already gitignored)"
else
    echo "❌ Error generating keystore"
    exit 1
fi

