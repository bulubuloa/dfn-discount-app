import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ShopifyFunction {
  app: {
    title: string;
  };
  apiType: string;
  title: string;
  id: string;
}

interface UserError {
  field: string;
  message: string;
}

interface DiscountResult {
  automaticAppDiscount: {
    discountId: string;
    title: string;
    status: string;
  };
  userErrors: UserError[];
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-shopify-shop-domain, x-shopify-access-token');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Set CORS headers for actual response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-shopify-shop-domain, x-shopify-access-token');

  try {
    const { title, startsAt, discountClasses } = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    const accessToken = req.headers['x-shopify-access-token'] as string;

    if (!shopDomain) {
      res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
      return;
    }

    if (!accessToken) {
      res.status(400).json({ 
        success: false, 
        error: 'Shopify access token is required' 
      });
      return;
    }

    console.log('Getting function ID for shop:', shopDomain);
    
    // Step 1: Get the Function ID using shopifyFunctions query
    // Based on Shopify documentation: https://shopify.dev/docs/apps/build/discounts/build-discount-function?extension=javascript
    const functionQuery = `
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

    const functionResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: functionQuery }),
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
    const discountFunction = functions.find((func: ShopifyFunction) => 
      func.apiType === 'discounts' && 
      (func.title === 'discount-function-js' || func.title === 'DFN Discount App')
    );

    if (!discountFunction) {
      res.status(400).json({ 
        success: false, 
        error: 'Discount function not found. Make sure the function is deployed.' 
      });
      return;
    }

    console.log('Found function:', discountFunction.id);

    // Step 2: Create the discount using discountAutomaticAppCreate mutation
    // Based on Shopify documentation
    const discountMutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${title || 'DFN Auto Discount'}"
            functionId: "${discountFunction.id}"
            discountClasses: [PRODUCT, ORDER, SHIPPING]
            startsAt: "${startsAt || new Date().toISOString()}"
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

    console.log('Creating discount with mutation:', discountMutation);

    const discountResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: discountMutation }),
    });

    if (!discountResponse.ok) {
      throw new Error(`Failed to create discount: ${discountResponse.status}`);
    }

    const discountData = await discountResponse.json();
    console.log('Discount response data:', JSON.stringify(discountData, null, 2));
    
    if (discountData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(discountData.errors)}`);
    }

    const result = discountData.data?.discountAutomaticAppCreate as DiscountResult;
    console.log('Discount creation result:', JSON.stringify(result, null, 2));
    
    if (result.userErrors && result.userErrors.length > 0) {
      throw new Error(`Discount creation failed: ${result.userErrors.map((e: UserError) => e.message).join(', ')}`);
    }

    if (!result.automaticAppDiscount) {
      throw new Error('Discount creation failed: No discount returned');
    }

    if (!result.automaticAppDiscount.discountId) {
      throw new Error('Discount creation failed: No discount ID returned');
    }

    console.log('Discount created successfully:', result.automaticAppDiscount.discountId);

    // Return the response format that the frontend expects
    const response = {
      success: true,
      message: 'Discount workflow executed successfully',
      summary: {
        discountId: result.automaticAppDiscount.discountId,
        functionId: discountFunction.id,
        title: result.automaticAppDiscount.title,
        status: result.automaticAppDiscount.status
      },
      workflow: {
        id: 'workflow-123',
        status: 'completed',
        steps: [
          'Function ID retrieved',
          'Discount created',
          'Discount activated'
        ]
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in discount workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
