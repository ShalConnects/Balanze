// PayPal API endpoint for creating orders
// This works with PayPal's REST API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, amount, currency, description } = req.body;

    // PayPal API credentials
    const clientId = process.env.VITE_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.VITE_PAYPAL_CLIENT_SECRET;
    const environment = process.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';
    
    const baseUrl = environment === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    
    if (!authData.access_token) {
      throw new Error('Failed to get PayPal access token');
    }

    // Create order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
            description: description,
            custom_id: planId,
          },
        ],
        application_context: {
          return_url: `${req.headers.origin}/settings?tab=plans&success=true`,
          cancel_url: `${req.headers.origin}/settings?tab=plans&canceled=true`,
        },
      }),
    });

    const orderData = await orderResponse.json();
    
    if (orderData.error) {
      throw new Error(orderData.error.message || 'Failed to create PayPal order');
    }

    res.status(200).json({ orderId: orderData.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
} 