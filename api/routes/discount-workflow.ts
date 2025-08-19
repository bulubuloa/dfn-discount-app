import { Request, Response } from 'express';

interface WorkflowRequest {
  title?: string;
  startsAt?: string;
  discountClasses?: string;
}

interface ShopifyFunction {
  app: {
    title: string;
  };
  apiType: string;
  title: string;
  id: string;
}

interface FunctionResponse {
  data?: {
    shopifyFunctions?: {
      nodes: ShopifyFunction[];
    };
  };
  errors?: any[];
}

interface DiscountResponse {
  data?: {
    discountAutomaticAppCreate?: {
      automaticAppDiscount?: {
        discountId: string;
      };
      userErrors?: Array<{
        field: string;
        message: string;
      }>;
    };
  };
  errors?: any[];
}

export const discountWorkflowHandler = async (req: Request, res: Response) => {
  try {
    const { title, startsAt, discountClasses }: WorkflowRequest = req.body;

    // Get the shop domain from the request headers or session
    const shop = req.headers['x-shopify-shop-domain'] as string || process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop domain not found' });
    }

    // Get access token from session or environment
    const accessToken = req.headers['x-shopify-access-token'] as string || process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token not found' });
    }

    // Step 1: Get the Function ID using the exact query from the user
    console.log('Step 1: Getting function ID...');
    
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

    const functionResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: functionQuery }),
    });

    if (!functionResponse.ok) {
      throw new Error(`Function query failed: ${functionResponse.status}`);
    }

    const functionData: FunctionResponse = await functionResponse.json();
    
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

    console.log('Function ID found:', discountFunction.id);

    // Step 2: Create the discount using the exact mutation from the user
    console.log('Step 2: Creating discount...');
    
    const discountMutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${title || 'Cart line, Order, Shipping discount'}"
            functionId: "${discountFunction.id}"
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

    const discountResponse = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: discountMutation }),
    });

    if (!discountResponse.ok) {
      throw new Error(`Discount creation failed: ${discountResponse.status}`);
    }

    const discountData: DiscountResponse = await discountResponse.json();
    
    if (discountData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(discountData.errors)}`);
    }

    const result = discountData.data?.discountAutomaticAppCreate;
    
    if (result?.userErrors && result.userErrors.length > 0) {
      throw new Error(`Discount creation failed: ${result.userErrors.map(e => e.message).join(', ')}`);
    }

    if (!result?.automaticAppDiscount) {
      throw new Error('Discount creation failed: No discount returned');
    }

    console.log('Discount created successfully:', result.automaticAppDiscount.discountId);

    res.status(200).json({
      success: true,
      workflow: {
        step1: {
          action: 'Get Function ID',
          status: 'success',
          functionId: discountFunction.id,
          functionTitle: discountFunction.title,
          appTitle: discountFunction.app?.title
        },
        step2: {
          action: 'Create Discount',
          status: 'success',
          discountId: result.automaticAppDiscount.discountId
        }
      },
      summary: {
        functionId: discountFunction.id,
        discountId: result.automaticAppDiscount.discountId,
        message: 'Complete workflow executed successfully!'
      },
      queries: {
        functionQuery: functionQuery,
        discountMutation: discountMutation
      }
    });

  } catch (error) {
    console.error('Error in discount workflow:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: {
        message: 'Workflow failed. Please use GraphiQL manually:',
        steps: [
          '1. Press "g" in your terminal to open GraphiQL',
          '2. Run the shopifyFunctions query to get your function ID',
          '3. Use the discountAutomaticAppCreate mutation with your function ID',
          '4. Check the GraphiQL setup page for detailed instructions'
        ],
        queries: {
          functionQuery: `query {
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
          discountMutation: `mutation {
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
      }
    });
  }
};
