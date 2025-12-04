// Simple CORS test endpoint
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple test response
  res.status(200).json({
    success: true,
    message: 'CORS test successful',
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });
}
