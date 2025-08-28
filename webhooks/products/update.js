#!/usr/bin/env node

/**
 * Shopify Webhook: Product Update
 * Automatically syncs quantity breaks to metafields when products are updated
 * This ensures your Shopify Functions always have access to the latest pricing data
 */

// Load environment variables
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// GraphQL query to get product variant with quantity breaks
const GET_VARIANT_QUERY = `
  query getProductVariant($id: ID!) {
    productVariant(id: $id) {
      id
      sku
      title
      price
      contextualPricing(context: {}) {
        quantityPriceBreaks(first: 10) {
          edges {
            node {
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
      product {
        id
        title
      }
    }
  }
`;

// Mutation to create/update metafields
const METAFIELD_MUTATION = `
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
  const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }

  return data.data;
}

async function syncVariantQuantityBreaks(variantId) {
  try {
    console.log(`🔄 Syncing quantity breaks for variant: ${variantId}`);
    
    // Get variant data with quantity breaks
    const data = await makeGraphQLRequest(GET_VARIANT_QUERY, { id: variantId });
    const variant = data.productVariant;
    
    if (!variant) {
      console.log(`❌ Variant not found: ${variantId}`);
      return { success: false, error: 'Variant not found' };
    }
    
    const quantityBreaks = variant.contextualPricing?.quantityPriceBreaks?.edges || [];
    
    if (quantityBreaks.length === 0) {
      console.log(`ℹ️  No quantity breaks found for variant: ${variant.sku}`);
      return { success: true, message: 'No quantity breaks to sync' };
    }
    
    console.log(`📊 Found ${quantityBreaks.length} quantity breaks for ${variant.sku}`);
    
    // Convert to metafield format
    const breaks = quantityBreaks.map(({ node: qpb }) => ({
      min: parseInt(qpb.minimumQuantity),
      price: qpb.price.amount
    }));

    const qbTiers = {
      fixed: variant.price,
      breaks: breaks.sort((a, b) => a.min - b.min) // Sort by minimum quantity
    };

    // Create metafield
    const metafieldInput = {
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.id
    };

    const result = await makeGraphQLRequest(METAFIELD_MUTATION, {
      metafields: [metafieldInput]
    });

    if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
      console.log(`❌ Errors creating metafield:`, result.metafieldsSet.userErrors);
      return { success: false, error: result.metafieldsSet.userErrors };
    }

    console.log(`✅ Successfully synced quantity breaks for ${variant.sku}`);
    return { 
      success: true, 
      sku: variant.sku,
      quantityBreaks: breaks.length,
      metafieldId: result.metafieldsSet.metafields[0].id
    };
    
  } catch (error) {
    console.error(`❌ Error syncing variant ${variantId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function handleProductUpdate(webhookData) {
  try {
    console.log('🔄 Processing product update webhook...');
    
    const product = webhookData;
    const variants = product.variants || [];
    
    console.log(`📦 Product: ${product.title} (${variants.length} variants)`);
    
    const results = [];
    
    // Sync each variant that might have quantity breaks
    for (const variant of variants) {
      if (variant.id) {
        const result = await syncVariantQuantityBreaks(variant.id);
        results.push({
          variantId: variant.id,
          sku: variant.sku,
          ...result
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Sync Summary: ${successCount} successful, ${errorCount} errors`);
    
    return {
      success: true,
      results,
      summary: {
        totalVariants: variants.length,
        successful: successCount,
        errors: errorCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error handling product update webhook:', error.message);
    return { success: false, error: error.message };
  }
}

// Webhook handler function
module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-shopify-shop-domain, x-shopify-access-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity (you should implement proper verification)
    const webhookData = req.body;
    
    if (!webhookData || !webhookData.id) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Process the webhook
    const result = await handleProductUpdate(webhookData);
    
    if (result.success) {
      res.status(200).json({
        message: 'Product update processed successfully',
        ...result
      });
    } else {
      res.status(500).json({
        error: 'Failed to process product update',
        ...result
      });
    }
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// For local testing
if (require.main === module) {
  console.log('🧪 Testing webhook handler locally...');
  
  if (!SHOP_DOMAIN || !ACCESS_TOKEN) {
    console.error('❌ Please set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN environment variables');
    process.exit(1);
  }
  
  // Test with a sample product update
  const testData = {
    id: 'gid://shopify/Product/123456789',
    title: 'Test Product',
    variants: [
      {
        id: 'gid://shopify/ProductVariant/123456789',
        sku: 'TEST-SKU-001'
      }
    ]
  };
  
  handleProductUpdate(testData)
    .then(result => {
      console.log('✅ Test completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}
