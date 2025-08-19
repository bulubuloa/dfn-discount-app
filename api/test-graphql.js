export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the shop domain from the request headers or session
    const shop = req.headers['x-shopify-shop-domain'] || process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shop) {
      return res.status(400).json({ 
        error: 'Shop domain not found',
        instructions: 'Set SHOPIFY_SHOP_DOMAIN environment variable or pass x-shopify-shop-domain header'
      });
    }

    // Get access token from session or environment
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token not found',
        instructions: 'Set SHOPIFY_ACCESS_TOKEN environment variable or pass x-shopify-access-token header'
      });
    }

    // Test the exact query from the user
    const testQuery = `
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

    console.log('Testing GraphQL connection...');
    console.log('Shop:', shop);
    console.log('Query:', testQuery);

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: testQuery }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const functions = data.data?.shopifyFunctions?.nodes || [];
    
    // Find the discount function
    const discountFunction = functions.find(func => 
      func.apiType === 'discounts' && 
      func.title === 'discount-function-js'
    );

    res.status(200).json({
      success: true,
      message: 'GraphQL connection successful!',
      shop: shop,
      totalFunctions: functions.length,
      allFunctions: functions,
      discountFunction: discountFunction ? {
        app: {
          title: discountFunction.app?.title
        },
        apiType: discountFunction.apiType,
        title: discountFunction.title,
        id: discountFunction.id
      } : null,
      nextSteps: discountFunction ? [
        '1. Use the function ID above in your discount creation',
        '2. Call /api/create-discount-automatic with the functionId',
        '3. Or use /api/discount-workflow for a complete workflow'
      ] : [
        '1. Deploy your discount function first',
        '2. Make sure the function title is "discount-function-js"',
        '3. Try again after deployment'
      ],
      apiEndpoints: {
        getFunctionId: '/api/shopify-functions',
        createDiscount: '/api/create-discount-automatic',
        completeWorkflow: '/api/discount-workflow'
      }
    });

  } catch (error) {
    console.error('GraphQL test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      troubleshooting: {
        checkEnvironmentVariables: [
          'SHOPIFY_SHOP_DOMAIN',
          'SHOPIFY_ACCESS_TOKEN'
        ],
        checkHeaders: [
          'x-shopify-shop-domain',
          'x-shopify-access-token'
        ],
        manualTest: {
          step1: 'Open GraphiQL by pressing "g" in your terminal',
          step2: 'Run the shopifyFunctions query',
          step3: 'Verify the connection works manually'
        }
      }
    });
  }
}
