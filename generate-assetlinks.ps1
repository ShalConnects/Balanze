# PowerShell script to generate assetlinks.json
# This script extracts the SHA-256 fingerprint from your keystore and generates the assetlinks.json file

Write-Host "Generating Android App Links configuration..." -ForegroundColor Cyan

# Check if keystore exists
$keystorePath = "balanze-release-key.jks"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: Keystore file not found at: $keystorePath" -ForegroundColor Red
    Write-Host "Please make sure the keystore file exists in the project root." -ForegroundColor Yellow
    exit 1
}

# Read keystore password from keystore.properties
$keystorePropsPath = "android\keystore.properties"
if (-not (Test-Path $keystorePropsPath)) {
    Write-Host "ERROR: keystore.properties not found" -ForegroundColor Red
    exit 1
}

$props = Get-Content $keystorePropsPath | ConvertFrom-StringData
$storePassword = $props.storePassword

Write-Host "Extracting SHA-256 fingerprint from keystore..." -ForegroundColor Yellow

# Use keytool to get the certificate fingerprint
$keytoolOutput = & keytool -list -v -keystore $keystorePath -alias balanze -storepass $storePassword 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error running keytool. Make sure Java is installed and keytool is in your PATH." -ForegroundColor Red
    exit 1
}

# Extract SHA256 fingerprint
$sha256Line = $keytoolOutput | Select-String -Pattern "SHA256:"
if (-not $sha256Line) {
    Write-Host "ERROR: Could not find SHA256 fingerprint in keytool output" -ForegroundColor Red
    Write-Host "Keytool output:" -ForegroundColor Yellow
    Write-Host $keytoolOutput
    exit 1
}

# Extract the fingerprint (remove "SHA256: " prefix and colons)
$sha256Fingerprint = ($sha256Line -replace ".*SHA256:\s*", "").Trim() -replace ":", ""

Write-Host "SUCCESS: Found SHA-256 fingerprint: $sha256Fingerprint" -ForegroundColor Green

# Create .well-known directory if it doesn't exist
$wellKnownDir = "public\.well-known"
if (-not (Test-Path $wellKnownDir)) {
    New-Item -ItemType Directory -Path $wellKnownDir | Out-Null
    Write-Host "Created directory: $wellKnownDir" -ForegroundColor Yellow
}

# Generate assetlinks.json using single-quoted here-string to avoid variable expansion issues
$assetlinksJson = @'
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.balanze.app",
      "sha256_cert_fingerprints": [
        "REPLACE_FINGERPRINT"
      ]
    }
  }
]
'@

# Replace the placeholder with actual fingerprint
$assetlinksJson = $assetlinksJson -replace "REPLACE_FINGERPRINT", $sha256Fingerprint

$assetlinksPath = Join-Path $wellKnownDir "assetlinks.json"
# Write file without BOM (Byte Order Mark) - required for Google's verification
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$absolutePath = (Resolve-Path $wellKnownDir).Path
$fullPath = Join-Path $absolutePath "assetlinks.json"
[System.IO.File]::WriteAllText($fullPath, $assetlinksJson, $utf8NoBom)

Write-Host "SUCCESS: Generated: $assetlinksPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit and push this file to your repository" -ForegroundColor White
Write-Host "2. Deploy to Vercel (or your hosting provider)" -ForegroundColor White
Write-Host "3. Verify it's accessible at: https://balanze.cash/.well-known/assetlinks.json" -ForegroundColor White
Write-Host "4. Test deep linking on an Android device" -ForegroundColor White
Write-Host ""
Write-Host "Verify with Google's tool:" -ForegroundColor Cyan
Write-Host "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://balanze.cash&relation=delegate_permission/common.handle_all_urls" -ForegroundColor White
