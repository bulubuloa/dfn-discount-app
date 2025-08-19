export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { functionId, title, startsAt, discountClasses } = req.body;

    // Validate required parameters
    if (!functionId) {
      return res.status(400).json({ error: 'functionId is required' });
    }

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

    // Use the exact mutation from the user's request
    const mutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${title || 'Cart line, Order, Shipping discount'}"
            functionId: "${functionId}"
            discountClasses: [${discountClasses || 'PRODUCT, ORDER, SHIPPING'}]
            startsAt: "${startsAt || '2025-01-01T00:00:00'}"
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
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: mutation }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const result = data.data?.discountAutomaticAppCreate;
    
    if (result.userErrors && result.userErrors.length > 0) {
      throw new Error(`Discount creation failed: ${result.userErrors.map(e => e.message).join(', ')}`);
    }

    if (!result.automaticAppDiscount) {
      throw new Error('Discount creation failed: No discount returned');
    }

    res.status(200).json({
      success: true,
      discountId: result.automaticAppDiscount.discountId,
      message: 'Discount created successfully!',
      mutation: mutation,
      requestBody: req.body
    });

  } catch (error) {
    console.error('Error creating discount:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      instructions: {
        message: 'Automatic creation failed. Please use GraphiQL manually:',
        steps: [
          '1. Press "g" in your terminal to open GraphiQL',
          '2. Run the shopifyFunctions query to get your function ID',
          '3. Use the discountAutomaticAppCreate mutation with your function ID',
          '4. Check the GraphiQL setup page for detailed instructions'
        ],
        exampleMutation: `mutation {
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
    });
  }
}
