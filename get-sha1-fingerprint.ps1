# PowerShell script to get SHA-1 fingerprint for Google OAuth Android client configuration
# This is required to fix DEVELOPER_ERROR (status code 10) in Google Sign-In

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SHA-1 Fingerprint Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
$keystorePath = "balanze-release-key.jks"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: Keystore file not found: $keystorePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure the keystore file exists in the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found keystore: $keystorePath" -ForegroundColor Green
Write-Host ""

# Get SHA-1 for release keystore
Write-Host "Getting SHA-1 fingerprint from RELEASE keystore..." -ForegroundColor Yellow
Write-Host "   (You will be prompted for the keystore password)" -ForegroundColor Gray
Write-Host ""

try {
    $output = keytool -list -v -keystore $keystorePath -alias balanze 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Error running keytool. Make sure Java is installed and in PATH." -ForegroundColor Red
        Write-Host "   Error: $output" -ForegroundColor Red
        exit 1
    }
    
    # Extract SHA-1 from output
    $sha1Line = $output | Select-String -Pattern "SHA1:"
    if ($sha1Line) {
        $sha1WithColons = ($sha1Line -split "SHA1:")[1].Trim()
        $sha1NoColons = $sha1WithColons -replace ":", ""
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SHA-1 Fingerprint (WITH colons):" -ForegroundColor Green
        Write-Host $sha1WithColons -ForegroundColor White
        Write-Host ""
        Write-Host "SHA-1 Fingerprint (NO colons - for Google Cloud Console):" -ForegroundColor Green
        Write-Host $sha1NoColons -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Also get SHA-256
        $sha256Line = $output | Select-String -Pattern "SHA256:"
        if ($sha256Line) {
            $sha256WithColons = ($sha256Line -split "SHA256:")[1].Trim()
            $sha256NoColons = $sha256WithColons -replace ":", ""
            
            Write-Host "SHA-256 Fingerprint (for reference):" -ForegroundColor Cyan
            Write-Host $sha256WithColons -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Go to Google Cloud Console: https://console.cloud.google.com/" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Go to APIs and Services, then Credentials" -ForegroundColor White
        Write-Host "4. Click Create Credentials, then OAuth 2.0 Client ID" -ForegroundColor White
        Write-Host "5. Choose Android as application type" -ForegroundColor White
        Write-Host "6. Enter:" -ForegroundColor White
        Write-Host "   - Package name: com.balanze.app" -ForegroundColor Cyan
        Write-Host "   - SHA-1 certificate fingerprint: $sha1NoColons" -ForegroundColor Cyan
        Write-Host "7. Click Create" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT: The Android OAuth client must be in the SAME project as your Web OAuth client!" -ForegroundColor Yellow
        Write-Host ""
        
    } else {
        Write-Host "ERROR: Could not find SHA-1 in keytool output" -ForegroundColor Red
        Write-Host "   Output: $output" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Tip: Copy the SHA-1 fingerprint (NO colons) and paste it into Google Cloud Console" -ForegroundColor Cyan

