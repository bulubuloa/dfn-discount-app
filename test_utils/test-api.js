const fetch = require('node-fetch');

async function testDiscountAPI() {
  try {
    console.log('Testing discount creation API...');
    
    const response = await fetch('http://localhost:3000/api/create-discount-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: "Test Discount",
        message: "Test message",
        config: {}
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success && data.discountId) {
      console.log(' SUCCESS: Discount created with ID:', data.discountId);
    } else {
      console.log(' FAILED:', data.error || 'Unknown error');
    }

  } catch (error) {
    console.error(' ERROR:', error.message);
  }
}

testDiscountAPI();
