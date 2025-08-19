// Vercel serverless function for creating discounts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // For now, return the GraphQL instructions since we can't access Shopify API directly from Vercel
    // without the full Shopify app context and authentication
    const fallbackInstructions = {
      message: 'Please use the GraphiQL interface to create your discount:',
      steps: [
        {
          step: 1,
          title: 'Get Function ID',
          description: 'Copy and run this query in GraphiQL (press "g" in your Shopify CLI terminal):',
          query: `query {
  shopifyFunctions(first: 25) {
    nodes {
      app {
        title
      }
      apiType
      title
      id
    }
  }
}`
        },
        {
          step: 2,
          title: 'Create Discount',
          description: 'Replace YOUR_FUNCTION_ID_HERE with the ID from step 1 and run this mutation:',
          query: `mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Cart line, Order, Shipping discount"
      functionId: "YOUR_FUNCTION_ID_HERE"
      discountClasses: [PRODUCT, ORDER, SHIPPING]
      startsAt: "2025-01-01T00:00:00"
    }
  ) {
    automaticAppDiscount {
      discountId
    }
    userErrors {
      field
      message
    }
  }
}`
        }
      ],
      config: {
        title: 'Cart line, Order, Shipping discount',
        functionId: 'YOUR_FUNCTION_ID_HERE',
        discountClasses: ['PRODUCT', 'ORDER', 'SHIPPING'],
        startsAt: '2025-01-01T00:00:00'
      },
      quickStart: {
        message: 'Quick Start:',
        instructions: [
          '1. Press "g" in your terminal to open GraphiQL',
          '2. Copy the first query above and run it',
          '3. Copy the function ID from the response',
          '4. Replace "YOUR_FUNCTION_ID_HERE" in the second query with your function ID',
          '5. Run the second query to create the discount'
        ]
      }
    };
    
    res.status(200).json({ 
      success: true, 
      type: 'instructions',
      message: 'GraphQL instructions generated successfully',
      instructions: fallbackInstructions
    });
    
  } catch (error) {
    console.error('Error in create-discount-simple:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
