export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the shop domain from the request headers or session
    const shop = req.headers['x-shopify-shop-domain'] || process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop domain not found' });
    }

    // Get access token from session or environment
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token not found' });
    }

    // GraphQL query to get function ID
    const query = `
      query {
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
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    // Find the discount function
    const functions = data.data?.shopifyFunctions?.nodes || [];
    const discountFunction = functions.find(func => 
      func.apiType === 'discounts' && 
      func.title === 'discount-function-js'
    );

    if (!discountFunction) {
      throw new Error('Discount function not found. Make sure the function is deployed.');
    }

    res.status(200).json({
      success: true,
      functionId: discountFunction.id,
      functionTitle: discountFunction.title,
      appTitle: discountFunction.app?.title
    });

  } catch (error) {
    console.error('Error getting function ID:', error);
    
    // Fallback to instructions if GraphQL fails
    res.status(200).json({
      success: false,
      error: error.message,
      instructions: {
        step1: 'Open GraphiQL by pressing "g" in your terminal where the app is running',
        step2: 'Use this query to get your function ID:',
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
}`,
        step3: 'Copy the "id" value from the response',
        note: 'The function ID is required to create discounts programmatically'
      },
      manualSteps: [
        '1. Press "g" in your terminal to open GraphiQL',
        '2. Select the latest API version',
        '3. Run the shopifyFunctions query',
        '4. Copy the function ID from the response'
      ]
    });
  }
}
