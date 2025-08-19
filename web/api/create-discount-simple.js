import shopify from "../shopify.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, message, config } = req.body;

    // Get shop from query parameters or headers
    const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop domain not found. Please access this app from within Shopify Admin.'
      });
    }

    // Create a session for the shop
    const session = await shopify.api.session.customAppSession(shop);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'No valid session found for this shop. Please install the app first.'
      });
    }

    const client = new shopify.api.clients.Graphql({ session });

    // Step 1: Get Function ID
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

    console.log('Getting function ID for shop:', shop);
    const functionResponse = await client.request(functionQuery);
    console.log('Function response:', functionResponse);

    // Find the discount function
    const functions = functionResponse.data?.shopifyFunctions?.nodes || [];
    const discountFunction = functions.find(func =>
      func.apiType === 'discounts' &&
      (func.title === 'discount-function-js' || func.title === 'DFN Discount App')
    );

    if (!discountFunction) {
      return res.status(404).json({
        success: false,
        error: 'Discount function not found. Make sure the function is deployed.'
      });
    }

    console.log('Found function:', discountFunction.id);

    // Step 2: Create the discount
    const mutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${title || 'DFN Auto Discount'}"
            functionId: "${discountFunction.id}"
            discountClasses: [PRODUCT, ORDER, SHIPPING]
            startsAt: "${new Date().toISOString()}"
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

    console.log('Creating discount...');
    const discountResponse = await client.request(mutation);
    console.log('Discount response:', discountResponse);

    const result = discountResponse.data?.discountAutomaticAppCreate;

    if (result.userErrors && result.userErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Discount creation failed: ${result.userErrors.map(e => e.message).join(', ')}`
      });
    }

    if (!result.automaticAppDiscount) {
      return res.status(500).json({
        success: false,
        error: 'Discount creation failed: No discount returned'
      });
    }

    if (!result.automaticAppDiscount.discountId) {
      return res.status(500).json({
        success: false,
        error: 'Discount creation failed: No discount ID returned'
      });
    }

    console.log('Discount created successfully:', result.automaticAppDiscount.discountId);

    res.status(200).json({
      success: true,
      discountId: result.automaticAppDiscount.discountId,
      title: result.automaticAppDiscount.title,
      status: result.automaticAppDiscount.status,
      message: 'Discount created successfully!',
      functionId: discountFunction.id
    });

  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Automatic discount creation failed. Please check the console for details.'
    });
  }
}
