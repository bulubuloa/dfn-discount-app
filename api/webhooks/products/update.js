// Webhook handler for automatic product sync
// This runs automatically when products are updated in Shopify

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity (recommended for production)
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const hmac = req.headers['x-shopify-hmac-sha256'];
      const body = JSON.stringify(req.body);
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body, 'utf8')
        .digest('base64');

      if (hash !== hmac) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const product = req.body;
    console.log(` Product updated webhook: ${product.title}`);

    // Get shop domain from headers
    const shopDomain = req.headers['x-shopify-shop-domain'] || 
                      req.headers['x-shopify-domain'] ||
                      extractShopFromWebhook(req.headers);

    if (!shopDomain) {
      console.log('  Could not determine shop domain from webhook');
      return res.status(400).json({ error: 'Shop domain not found' });
    }

    // For automatic sync, you'll need to store access tokens securely
    // This is a simplified example - in production, retrieve from your database
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || 
                       await getAccessTokenForShop(shopDomain);

    if (!accessToken) {
      console.log('  No access token available for auto-sync');
      return res.status(400).json({ error: 'Access token not available' });
    }

    // Sync only this specific product's variants
    const syncResult = await syncProductQuantityBreaks(product.id, shopDomain, accessToken);
    
    console.log(` Auto-sync completed for ${product.title}:`, syncResult);

    res.status(200).json({
      success: true,
      message: `Synced ${product.title}`,
      result: syncResult
    });

  } catch (error) {
    console.error(' Webhook sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function syncProductQuantityBreaks(productId, shopDomain, accessToken) {
  const PRODUCT_VARIANTS_QUERY = `
    query getProductVariants($productId: ID!) {
      product(id: $productId) {
        id
        title
        variants(first: 100) {
          edges {
            node {
              id
              sku
              title
              price
              quantityPriceBreaks {
                id
                minimumQuantity
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  `;

  const CREATE_METAFIELDS_MUTATION = `
    mutation metafieldSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  async function makeGraphQLRequest(query, variables = {}) {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  // Get product variants
  const data = await makeGraphQLRequest(PRODUCT_VARIANTS_QUERY, {
    productId: `gid://shopify/Product/${productId}`
  });

  if (!data.product) {
    return { message: 'Product not found', variantsUpdated: 0 };
  }

  const variants = data.product.variants.edges.map(edge => edge.node);
  const variantsWithBreaks = variants.filter(variant => 
    variant.quantityPriceBreaks && variant.quantityPriceBreaks.length > 0
  );

  if (variantsWithBreaks.length === 0) {
    return { 
      message: 'No quantity breaks found on this product', 
      variantsUpdated: 0 
    };
  }

  // Convert to metafields
  const metafieldsToCreate = [];

  for (const variant of variantsWithBreaks) {
    const breaks = variant.quantityPriceBreaks.map(qpb => ({
      min: parseInt(qpb.minimumQuantity),
      price: qpb.price.amount
    }));

    const qbTiers = {
      fixed: variant.price,
      breaks: breaks.sort((a, b) => a.min - b.min)
    };

    metafieldsToCreate.push({
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.id
    });
  }

  // Create metafields
  const result = await makeGraphQLRequest(CREATE_METAFIELDS_MUTATION, {
    metafields: metafieldsToCreate
  });

  const errors = result.metafieldsSet.userErrors || [];
  const successCount = metafieldsToCreate.length - errors.length;

  return {
    productTitle: data.product.title,
    variantsProcessed: variants.length,
    variantsWithBreaks: variantsWithBreaks.length,
    metafieldsCreated: successCount,
    errors: errors.length
  };
}

function extractShopFromWebhook(headers) {
  // Try to extract shop domain from various webhook headers
  const shopHeader = headers['x-shopify-shop-domain'] ||
                    headers['x-shopify-domain'] ||
                    headers['shopify-shop-domain'];
  
  if (shopHeader) {
    return shopHeader;
  }

  // If no direct header, you might need to parse from other headers
  // This depends on your webhook setup
  return null;
}

async function getAccessTokenForShop(shopDomain) {
  // In production, you would retrieve the access token from your database
  // based on the shop domain. For now, return the environment variable.
  
  // Example implementation:
  // const shop = await db.shops.findOne({ domain: shopDomain });
  // return shop?.accessToken;
  
  return process.env.SHOPIFY_ACCESS_TOKEN;
}
