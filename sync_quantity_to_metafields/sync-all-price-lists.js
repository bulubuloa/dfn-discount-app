#!/usr/bin/env node

/**
 * Sync ALL Price Lists Quantity Breaks to Metafields
 * 
 * This script fetches ALL quantity breaks from Price Lists with proper pagination
 * and converts them to metafields that your Shopify Functions can access.
 */

import dotenv from 'dotenv';
dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'btsa-shop-staging-2025.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || 'your-access-token';

// Query to get a single price list with all its prices
const GET_PRICE_LIST_QUERY = `
  query getPriceList($id: ID!, $first: Int!, $after: String) {
    priceList(id: $id) {
      id
      name
      prices(first: $first, after: $after) {
        edges {
          node {
            variant {
              id
              title
              price
              product {
                id
                title
              }
            }
            quantityPriceBreaks(first: 10) {
              edges {
                node {
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
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Query to get all price lists
const GET_ALL_PRICE_LISTS_QUERY = `
  query getAllPriceLists($first: Int!, $after: String) {
    priceLists(first: $first, after: $after) {
      edges {
        node {
          id
          name
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

async function getAllPriceLists() {  
  let allPriceLists = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    
    const data = await makeGraphQLRequest(GET_ALL_PRICE_LISTS_QUERY, {
      first: 10,
      after: cursor
    });

    const priceLists = data.priceLists.edges;
    allPriceLists = allPriceLists.concat(priceLists);
    
    hasNextPage = data.priceLists.pageInfo.hasNextPage;
    cursor = data.priceLists.pageInfo.endCursor;    
  }

  return allPriceLists;
}

async function getAllPricesFromPriceList(priceListId, priceListName) {  
  let allPrices = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    
    const data = await makeGraphQLRequest(GET_PRICE_LIST_QUERY, {
      id: priceListId,
      first: 100,
      after: cursor
    });

    if (data.priceList && data.priceList.prices) {
      const prices = data.priceList.prices.edges;
      allPrices = allPrices.concat(prices);
      
      hasNextPage = data.priceList.prices.pageInfo.hasNextPage;
      cursor = data.priceList.prices.pageInfo.endCursor;
      
    } else {
      hasNextPage = false;
    }
  }

  return allPrices;
}

async function getAllVariantsWithQuantityBreaks() {  
  const priceLists = await getAllPriceLists();
  let allVariantsWithBreaks = [];

  for (const { node: priceList } of priceLists) {
    const prices = await getAllPricesFromPriceList(priceList.id, priceList.name);
    
    // Filter prices that have quantity breaks
    const variantsWithBreaks = prices.filter(({ node: price }) => 
      price.quantityPriceBreaks.edges.length > 0
    );

    if (variantsWithBreaks.length > 0) {      
      // Add price list info to each variant
      variantsWithBreaks.forEach(({ node: price }) => {
        allVariantsWithBreaks.push({
          ...price,
          priceListName: priceList.name,
          priceListId: priceList.id
        });
      });
    } else {
      console.log(`  No variants with quantity breaks in ${priceList.name}`);
    }
  }

  return allVariantsWithBreaks;
}

async function convertToMetafields(variantsWithQuantityBreaks) {  
  const metafieldsToCreate = [];
  const conversionReport = [];

  for (const variant of variantsWithQuantityBreaks) {
    const quantityBreaks = variant.quantityPriceBreaks.edges;
    
    // Convert to our metafield format
    const breaks = quantityBreaks.map(({ node: qpb }) => {
      return {
        min: parseInt(qpb.minimumQuantity),
        price: qpb.price.amount
      };
    });

    const qbTiers = {
      fixed: variant.variant.price,
      breaks: breaks.sort((a, b) => a.min - b.min)
    };

    metafieldsToCreate.push({
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(qbTiers),
      ownerId: variant.variant.id
    });

    conversionReport.push({
      product: variant.variant.product.title,
      variant: variant.variant.title,
      sku: variant.variant.id.split('/').pop(),
      basePrice: variant.variant.price,
      quantityBreaks: breaks.length,
      priceList: variant.priceListName,
      converted: true
    });
  }

  return { metafieldsToCreate, conversionReport };
}

async function createMetafieldsInBatches(metafieldsToCreate) {  
  const BATCH_SIZE = 25;
  const batches = [];
  
  for (let i = 0; i < metafieldsToCreate.length; i += BATCH_SIZE) {
    batches.push(metafieldsToCreate.slice(i, i + BATCH_SIZE));
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const result = await makeGraphQLRequest(CREATE_METAFIELDS_MUTATION, {
        metafields: batch
      });

      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        console.log(`Errors in batch ${i + 1}:`, result.metafieldsSet.userErrors);
        errorCount += result.metafieldsSet.userErrors.length;
      } else {
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
  console.log(`Total variants processed: ${conversionReport.length}`);
  console.log(`Metafields created successfully: ${successCount}`);
  console.log(`Errors encountered: ${errorCount}`);
  
  const groupedByProduct = conversionReport.reduce((acc, item) => {
    if (!acc[item.product]) {
      acc[item.product] = [];
    }
    acc[item.product].push(item);
    return acc;
  }, {});
}

async function syncAllPriceLists() {
  try {
    // Step 1: Get all variants with quantity breaks
    const variantsWithQuantityBreaks = await getAllVariantsWithQuantityBreaks();
    
    if (variantsWithQuantityBreaks.length === 0) {
      console.log('No variants with quantity breaks found in any price list.');
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

setTimeout(() => {
  syncAllPriceLists();
}, 3000);
