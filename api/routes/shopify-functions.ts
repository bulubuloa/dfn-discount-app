import { Request, Response } from 'express';

interface ShopifyFunction {
  app: {
    title: string;
  };
  apiType: string;
  title: string;
  id: string;
}

interface GraphQLResponse {
  data?: {
    shopifyFunctions?: {
      nodes: ShopifyFunction[];
    };
  };
  errors?: any[];
}

export const shopifyFunctionsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the shop domain from the request headers or session
    const shop = req.headers['x-shopify-shop-domain'] as string || process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shop) {
      res.status(400).json({ error: 'Shop domain not found' });
      return;
    }

    // Get access token from session or environment
    const accessToken = req.headers['x-shopify-access-token'] as string || process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      res.status(400).json({ error: 'Access token not found' });
      return;
    }

    // GraphQL query to get function ID - using the exact query from the user
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

    const data: GraphQLResponse = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    // Return all functions for debugging
    const functions = data.data?.shopifyFunctions?.nodes || [];
    
    // Find the discount function
    const discountFunction = functions.find(func => 
      func.apiType === 'discounts' && 
      func.title === 'discount-function-js'
    );

    res.status(200).json({
      success: true,
      allFunctions: functions,
      discountFunction: discountFunction ? {
        app: {
          title: discountFunction.app?.title
        },
        apiType: discountFunction.apiType,
        title: discountFunction.title,
        id: discountFunction.id
      } : null,
      message: discountFunction ? 'Function found' : 'Discount function not found'
    });

  } catch (error) {
    console.error('Error getting function ID:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
      }
    });
  }
};
