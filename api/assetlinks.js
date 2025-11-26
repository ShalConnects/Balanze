// Serverless function to serve assetlinks.json without BOM
// This ensures Google's verification tool can parse it correctly

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set correct headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  // Asset links JSON content (without BOM)
  const assetlinksJson = JSON.stringify([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.balanze.app',
        sha256_cert_fingerprints: [
          'C889D578ED2FA09539B9DB82F2DEA76E08E6C930D2C1020092513A30B9E0C6EE'
        ]
      }
    }
  ], null, 2);

  // Send response without BOM
  return res.status(200).send(assetlinksJson);
}

