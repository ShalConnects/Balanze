// Test script to verify CORS fix
const testCors = async () => {
  const endpoints = [
    'https://balanze.cash/api/cors-test',
    'https://balanze.cash/api/send-last-wish-email'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Testing CORS for: ${endpoint}`);
      
      // Test OPTIONS preflight request
      const optionsResponse = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      console.log(`OPTIONS Status: ${optionsResponse.status}`);
      console.log(`CORS Headers:`, {
        'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
      });
      
      if (endpoint.includes('cors-test')) {
        // Test actual POST request for cors-test
        const postResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          },
          body: JSON.stringify({ test: true })
        });
        
        console.log(`POST Status: ${postResponse.status}`);
        const data = await postResponse.json();
        console.log(`Response:`, data);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error.message);
    }
  }
};

// Run the test
testCors().then(() => {
  console.log('\n✅ CORS test completed');
}).catch(console.error);
