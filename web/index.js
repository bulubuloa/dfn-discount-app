// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use(express.json());

// Test endpoint for debugging (no authentication required)
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// Apply authentication middleware to specific API routes that need it
app.get("/api/products/count", shopify.validateAuthenticatedSession(), async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", shopify.validateAuthenticatedSession(), async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

// Discount API routes with authentication
app.get("/api/get-function-id", shopify.validateAuthenticatedSession(), async (req, res) => {
  console.log("Get function ID endpoint hit");
  try {
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    const GET_FUNCTIONS = `
      query getFunctions {
        shopifyFunctions(first: 10) {
          nodes {
            id
            title
            apiType
            app {
              title
            }
          }
        }
      }
    `;

    console.log("Making GraphQL request...");
    const data = await client.request(GET_FUNCTIONS);
    console.log("GraphQL response:", data);
    
    // Find our function
    const ourFunction = data.shopifyFunctions.nodes.find(
      func => func.title === 'DFN Discount App' || func.title === 'discount-function'
    );

    if (!ourFunction) {
      console.log("Function not found in response");
      return res.status(404).json({ error: 'Function not found. Make sure the function is deployed.' });
    }

    console.log("Function found:", ourFunction);
    return res.status(200).json({ 
      functionId: ourFunction.id,
      functionTitle: ourFunction.title,
      apiType: ourFunction.apiType
    });

  } catch (error) {
    console.error('Error getting function ID:', error);
    return res.status(500).json({ 
      error: 'Failed to get function ID',
      details: error.message 
    });
  }
});

app.post("/api/create-discount", shopify.validateAuthenticatedSession(), async (req, res) => {
  try {
    const { functionId, title, message, config } = req.body;

    if (!functionId || !title) {
      return res.status(400).json({ error: 'Missing required fields: functionId, title' });
    }

    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    const CREATE_DISCOUNT = `
      mutation createAutomaticDiscount($input: AutomaticDiscountInput!) {
        automaticDiscountCreate(input: $input) {
          automaticDiscount {
            id
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

    // Prepare the discount input
    const discountInput = {
      title: title,
      message: message || "🎉 Special discount applied automatically!",
      functionId: functionId,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      customerGets: {
        value: {
          percentage: 0 // The function will handle the actual discount logic
        },
        items: {
          all: true
        }
      },
      customerSelection: {
        all: true
      },
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToAmount: config?.minimumOrderAmount || 0
        }
      }
    };

    // Create the discount
    const data = await client.request(CREATE_DISCOUNT, {
      input: discountInput
    });

    if (data.automaticDiscountCreate.userErrors.length > 0) {
      const errors = data.automaticDiscountCreate.userErrors.map(err => `${err.field}: ${err.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Failed to create discount',
        details: errors 
      });
    }

    const discount = data.automaticDiscountCreate.automaticDiscount;

    return res.status(200).json({ 
      success: true,
      discountId: discount.id,
      discountTitle: discount.title,
      status: discount.status,
      message: 'Discount created successfully!'
    });

  } catch (error) {
    console.error('Error creating discount:', error);
    return res.status(500).json({ 
      error: 'Failed to create discount',
      details: error.message 
    });
  }
});

// Simple endpoint that automatically creates discount (requires Shopify session)
app.post("/api/create-discount-simple", shopify.validateAuthenticatedSession(), async (req, res) => {
  try {
    const { title, message, config } = req.body;

    // Get shop and session from Shopify context
    const shop = res.locals.shopify.session.shop;
    const accessToken = res.locals.shopify.session.accessToken;

    console.log('Creating discount automatically for shop:', shop);

    // Step 1: Get Function ID
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
      (func.title === 'discount-function-js' || func.title === 'DFN Discount App')
    );

    if (!discountFunction) {
      throw new Error('Discount function not found. Make sure the function is deployed.');
    }

    console.log('Found function:', discountFunction.id);

    // Step 2: Create the discount automatically
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
    console.log('Discount response data:', JSON.stringify(discountData, null, 2));
    
    if (discountData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(discountData.errors)}`);
    }

    const result = discountData.data?.discountAutomaticAppCreate;
    console.log('Discount creation result:', JSON.stringify(result, null, 2));
    
    if (result.userErrors && result.userErrors.length > 0) {
      throw new Error(`Discount creation failed: ${result.userErrors.map(e => e.message).join(', ')}`);
    }

    if (!result.automaticAppDiscount) {
      throw new Error('Discount creation failed: No discount returned');
    }

    if (!result.automaticAppDiscount.discountId) {
      throw new Error('Discount creation failed: No discount ID returned');
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
    console.error('Error creating discount automatically:', error);
    
    // Return error response instead of fake success
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Automatic discount creation failed. Please check the console for details.'
    });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
