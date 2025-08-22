#!/usr/bin/env node

/**
 * Sync ALL Products Quantity Price Breaks to Metafields
 * 
 * This script fetches ALL products from your store using Admin API,
 * finds any with quantityPriceBreaks, and converts them to metafields
 * that your Shopify Functions can access.
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'your-shop.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || 'your-access-token';

// Query to get ALL product variants with pagination
const GET_VARIANTS_QUERY = `
  query getProductVariants($first: Int!, $after: String) {
    productVariants(first: $first, after: $after) {
      edges {
        node {
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
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Mutation to create metafields
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

async function getAllVariantsWithQuantityBreaks() {
  console.log('Fetching ALL product variants from your store...');
  
  let allVariants = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}...`);
    
    const data = await makeGraphQLRequest(GET_VARIANTS_QUERY, {
      first: 100,
      after: cursor
    });

    const variants = data.productVariants.edges;
    allVariants = allVariants.concat(variants);
    
    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
    
    console.log(`   Found ${variants.length} variants on this page`);
  }

  console.log(`Total variants fetched: ${allVariants.length}`);
  
  // Filter variants that have quantity breaks
  const variantsWithQuantityBreaks = allVariants.filter(({ node }) => 
    node.contextualPricing && 
    node.contextualPricing.quantityPriceBreaks &&
    node.contextualPricing.quantityPriceBreaks.edges.length > 0
  );

    console.log(`Variants with quantity breaks: ${variantsWithQuantityBreaks.length}`);

  return variantsWithQuantityBreaks;
}

async function convertToMetafields(variantsWithQuantityBreaks) {
  console.log('Converting quantity breaks to metafields format...');
  
  const metafieldsToCreate = [];
  const conversionReport = [];

  for (const { node: variant } of variantsWithQuantityBreaks) {
    const quantityBreaks = variant.contextualPricing.quantityPriceBreaks.edges;
    
    console.log(`\nProcessing: ${variant.product.title} - ${variant.title} (${variant.sku})`);
    console.log(`   Base price: $${variant.price}`);
    console.log(`   Quantity breaks: ${quantityBreaks.length}`);
    
    // Convert to our metafield format
    const breaks = quantityBreaks.map(({ node: qpb }) => {
      console.log(`   - ${qpb.minimumQuantity}+ items at $${qpb.price.amount} each`);
      return {
        min: parseInt(qpb.minimumQuantity),
        price: qpb.price.amount
      };
    });

    const qbTiers = {
      fixed: variant.price,
      breaks: breaks.sort((a, b) => a.min - b.min) // Sort by minimum quantity
    };

    metafieldsToCreate.push({
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.id
    });

    conversionReport.push({
      product: variant.product.title,
      variant: variant.title,
      sku: variant.sku,
      basePrice: variant.price,
      quantityBreaks: breaks.length,
      converted: true
    });
  }

  return { metafieldsToCreate, conversionReport };
}

async function createMetafieldsInBatches(metafieldsToCreate) {
  console.log(`\nCreating ${metafieldsToCreate.length} metafields in batches...`);
  
  const BATCH_SIZE = 25; // Shopify's recommended batch size
  const batches = [];
  
  for (let i = 0; i < metafieldsToCreate.length; i += BATCH_SIZE) {
    batches.push(metafieldsToCreate.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} metafields each`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} metafields)...`);
    
    try {
      const result = await makeGraphQLRequest(CREATE_METAFIELDS_MUTATION, {
        metafields: batch
      });

      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        console.log(`Errors in batch ${i + 1}:`, result.metafieldsSet.userErrors);
        errorCount += result.metafieldsSet.userErrors.length;
      } else {
        console.log(`Batch ${i + 1} completed successfully`);
        successCount += batch.length;
      }
    } catch (error) {
      console.error(`Error processing batch ${i + 1}:`, error.message);
      errorCount += batch.length;
    }

    // Add a small delay between batches to avoid rate limits
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { successCount, errorCount };
}

function printSummaryReport(conversionReport, successCount, errorCount) {
  console.log('\n' + '='.repeat(80));
  console.log('SYNC SUMMARY REPORT');
  console.log('='.repeat(80));
  
  console.log(`\nStatistics:`);
  console.log(`   Total products processed: ${conversionReport.length}`);
  console.log(`   Metafields created successfully: ${successCount}`);
  console.log(`   Errors encountered: ${errorCount}`);
  
  console.log(`\nProducts with quantity breaks converted:`);
  
  const groupedByProduct = conversionReport.reduce((acc, item) => {
    if (!acc[item.product]) {
      acc[item.product] = [];
    }
    acc[item.product].push(item);
    return acc;
  }, {});

  Object.entries(groupedByProduct).forEach(([productName, variants]) => {
    console.log(`\n${productName}:`);
    variants.forEach(variant => {
      console.log(`   - ${variant.variant} (${variant.sku}): ${variant.quantityBreaks} breaks @ $${variant.basePrice} base`);
    });
  });

  console.log(`\nYour Shopify Functions can now access quantity break data for all these products!`);
  console.log(`All products will work with your discount function.`);
}

async function syncAllProducts() {
  try {
    console.log('Starting comprehensive sync of ALL products...');
    console.log(`Store: ${SHOP_DOMAIN}`);
    console.log(`Using access token: ${ACCESS_TOKEN.substring(0, 8)}...`);
    
    // Step 1: Get all variants with quantity breaks
    const variantsWithQuantityBreaks = await getAllVariantsWithQuantityBreaks();
    
    if (variantsWithQuantityBreaks.length === 0) {
      console.log('No products with quantity breaks found in your store.');
      console.log('Make sure you have quantity pricing set up on some products first.');
      return;
    }

    // Step 2: Convert to metafields format
    const { metafieldsToCreate, conversionReport } = await convertToMetafields(variantsWithQuantityBreaks);

    // Step 3: Create metafields in batches
    const { successCount, errorCount } = await createMetafieldsInBatches(metafieldsToCreate);

    // Step 4: Print summary report
    printSummaryReport(conversionReport, successCount, errorCount);

  } catch (error) {
    console.error('Error during sync:', error.message);
    console.error('Please check your SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN');
  }
}

// Check if required environment variables are set
if (!SHOP_DOMAIN || SHOP_DOMAIN === 'your-shop.myshopify.com') {
  console.error('Please set SHOPIFY_SHOP_DOMAIN environment variable');
  process.exit(1);
}

if (!ACCESS_TOKEN || ACCESS_TOKEN === 'your-access-token') {
  console.error('Please set SHOPIFY_ACCESS_TOKEN environment variable');
  process.exit(1);
}

console.log(`
ALL PRODUCTS QUANTITY BREAKS SYNC TOOL
==========================================

This script will:
- Fetch ALL products from your Shopify store
- Find products with quantity pricing (quantityPriceBreaks) 
- Convert them to metafields for Shopify Functions
- Create metafields in efficient batches
- Provide detailed reporting

After running this script, your discount function will work
with ALL products that have quantity pricing!

Starting sync in 3 seconds...
`);

// Give user a moment to read the info
setTimeout(() => {
  syncAllProducts();
}, 3000);
