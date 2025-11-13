#!/bin/bash

# Script to build Android App Bundle (AAB) for Play Store upload
# This generates a signed AAB file ready for Google Play Store

echo "🚀 Building Android App Bundle (AAB) for Balanze..."

# Step 1: Build web assets
echo "📦 Step 1: Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Web build failed!"
    exit 1
fi

# Step 2: Sync Capacitor
echo "🔄 Step 2: Syncing Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Error: Capacitor sync failed!"
    exit 1
fi

# Step 3: Check if keystore exists
if [ ! -f "balanze-release-key.jks" ]; then
    echo "❌ Error: Keystore not found!"
    echo "📝 Please run generate-keystore.sh first to create the signing key"
    exit 1
fi

# Step 4: Build AAB
echo "🔨 Step 3: Building signed AAB..."
cd android
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    cd ..
    AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    if [ -f "$AAB_PATH" ]; then
        AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
        echo ""
        echo "✅ AAB built successfully!"
        echo "📦 Location: $AAB_PATH"
        echo "📊 Size: $AAB_SIZE"
        echo ""
        echo "🎯 Next steps:"
        echo "   1. Upload $AAB_PATH to Google Play Console"
        echo "   2. Go to: Play Console > Your App > Release > Production/Testing"
        echo "   3. Create a new release and upload the AAB file"
        echo ""
        echo "💡 Tip: Consider opting into Play App Signing for better security"
    else
        echo "❌ Error: AAB file not found at expected location"
        exit 1
    fi
else
    cd ..
    echo "❌ Error: AAB build failed!"
    exit 1
fi

