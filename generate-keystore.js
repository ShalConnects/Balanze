#!/usr/bin/env node

/**
 * Generate Android signing keystore for Balanze app
 * Cross-platform script that works on Windows, Mac, and Linux
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating Android signing keystore for Balanze...\n');

// Read keystore properties
const keystorePropsPath = path.join(__dirname, 'android', 'keystore.properties');

if (!fs.existsSync(keystorePropsPath)) {
    console.error('❌ Error: android/keystore.properties not found!');
    process.exit(1);
}

const propsContent = fs.readFileSync(keystorePropsPath, 'utf8');
const storePassword = propsContent.match(/storePassword=(.+)/)?.[1];
const keyPassword = propsContent.match(/keyPassword=(.+)/)?.[1];
const keyAlias = propsContent.match(/keyAlias=(.+)/)?.[1];

if (!storePassword || !keyPassword || !keyAlias) {
    console.error('❌ Error: Invalid keystore.properties format!');
    process.exit(1);
}

const keystoreFile = path.join(__dirname, 'balanze-release-key.jks');

// Check if keystore already exists
if (fs.existsSync(keystoreFile)) {
    console.log('⚠️  Keystore already exists at', keystoreFile);
    console.log('   Delete it first if you want to regenerate.');
    process.exit(0);
}

// Generate keystore
const keytoolCommand = `keytool -genkey -v -keystore "${keystoreFile}" -alias "${keyAlias}" -keyalg RSA -keysize 2048 -validity 10000 -storepass "${storePassword}" -keypass "${keyPassword}" -dname "CN=Balanze, OU=Development, O=Balanze, L=Unknown, ST=Unknown, C=US"`;

try {
    console.log('Generating keystore...');
    execSync(keytoolCommand, { stdio: 'inherit' });
    
    if (fs.existsSync(keystoreFile)) {
        console.log('\n✅ Keystore generated successfully at', keystoreFile);
        console.log('📝 IMPORTANT: Keep this file and the password secure!');
        console.log('📝 The password is stored in android/keystore.properties (already gitignored)');
    } else {
        console.error('\n❌ Error: Keystore file was not created');
        process.exit(1);
    }
} catch (error) {
    console.error('\n❌ Error generating keystore:', error.message);
    console.error('   Make sure Java JDK is installed and keytool is in your PATH');
    process.exit(1);
}

