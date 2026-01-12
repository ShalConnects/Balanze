// Serverless function to serve assetlinks.json without BOM
// This ensures Google's verification tool can parse it correctly

export default async function handler(req, res) {
  // Log that this function is being called (for debugging)
  console.log('Assetlinks API called:', req.url);
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set correct headers - NO BOM, no cache to force fresh response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Asset links JSON content (without BOM - using Buffer to ensure no BOM)
  // Fingerprint must be WITHOUT colons (64 hex characters) - Google Play Console requirement
  const fingerprint = 'D2159A1A3BB2D76DCC6D8F39A14BB7E8E67310757D9E0936C38331E913EFE3C7';
  
  // Log the fingerprint for debugging
  console.log('SHA-256 fingerprint:', fingerprint);
  console.log('Fingerprint length:', fingerprint.length);
  
  const assetlinksData = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.balanze.app',
        sha256_cert_fingerprints: [
          fingerprint  // Use fingerprint WITHOUT colons (Google requirement)
        ]
      }
    }
  ];
  
  const assetlinksJson = JSON.stringify(assetlinksData, null, 2);
  
  // Log the JSON to verify format
  console.log('Generated JSON:', assetlinksJson);
  
  // Ensure no BOM - create buffer explicitly without BOM
  const buffer = Buffer.from(assetlinksJson, 'utf8');
  
  // Verify no BOM (first 3 bytes should NOT be EF BB BF)
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.error('ERROR: BOM detected in response!');
    // Remove BOM if somehow present
    return res.status(200).end(buffer.slice(3));
  }
  
  // Send response without BOM
  return res.status(200).end(buffer);
}

