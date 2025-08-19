export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, message, config } = req.body;

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

    // First, get the function ID
    const functionResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: `
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
        `
      }),
    });

    if (!functionResponse.ok) {
      throw new Error(`Failed to get functions: ${functionResponse.status}`);
    }

    const functionData = await functionResponse.json();
    
    if (functionData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(functionData.errors)}`);
    }

    // Find the discount function
    const functions = functionData.data?.shopifyFunctions?.nodes || [];
    const discountFunction = functions.find(func => 
      func.apiType === 'discounts' && 
      func.title === 'discount-function-js'
    );

    if (!discountFunction) {
      throw new Error('Discount function not found. Make sure the function is deployed.');
    }

    // Now create the discount using the function ID
    const mutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${title || 'DFN Auto Discount'}"
            functionId: "${discountFunction.id}"
            discountClasses: [PRODUCT, ORDER, SHIPPING]
            startsAt: "${new Date().toISOString()}"
            metafields: [
              {
                namespace: "dfn"
                key: "config"
                type: "json"
                value: "${JSON.stringify(config || {}).replace(/"/g, '\\"')}"
              }
            ]
          }
        ) {
          automaticAppDiscount {
            discountId
            title
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const discountResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: mutation }),
    });

    if (!discountResponse.ok) {
      throw new Error(`Failed to create discount: ${discountResponse.status}`);
    }

    const discountData = await discountResponse.json();
    
    if (discountData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(discountData.errors)}`);
    }

    const result = discountData.data?.discountAutomaticAppCreate;
    
    if (result.userErrors && result.userErrors.length > 0) {
      throw new Error(`Discount creation failed: ${result.userErrors.map(e => e.message).join(', ')}`);
    }

    if (!result.automaticAppDiscount) {
      throw new Error('Discount creation failed: No discount returned');
    }

    res.status(200).json({
      success: true,
      discountId: result.automaticAppDiscount.discountId,
      title: result.automaticAppDiscount.title,
      status: result.automaticAppDiscount.status,
      message: 'Discount created successfully!'
    });

  } catch (error) {
    console.error('Error creating discount:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      fallbackInstructions: {
        message: 'Automatic creation failed. Please use GraphiQL manually:',
        steps: [
          '1. Press "g" in your terminal to open GraphiQL',
          '2. Run the shopifyFunctions query to get your function ID',
          '3. Use the discountAutomaticAppCreate mutation with your function ID',
          '4. Check the GraphiQL setup page for detailed instructions'
        ]
      }
    });
  }
}
