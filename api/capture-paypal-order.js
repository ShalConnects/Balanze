// PayPal API endpoint for capturing payments
// This captures the payment after user approval

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, planId } = req.body;

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

    // Capture the payment
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();
    
    if (captureData.error) {
      throw new Error(captureData.error.message || 'Failed to capture PayPal payment');
    }

    // Check if payment was successful
    if (captureData.status === 'COMPLETED') {
      res.status(200).json({ 
        success: true, 
        transactionId: captureData.purchase_units[0].payments.captures[0].id,
        amount: captureData.purchase_units[0].payments.captures[0].amount.value,
        currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
        planId: planId
      });
    } else {
      throw new Error('Payment was not completed');
    }
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to capture PayPal payment' 
    });
  }
} 