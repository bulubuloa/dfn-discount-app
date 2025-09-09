#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'btsa-shop-staging-2025.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || 'your-access-token';

// Query to get Price Lists with quantity breaks
const GET_PRICE_LISTS_QUERY = `
  query getPriceLists($first: Int!, $after: String) {
    priceLists(first: $first, after: $after) {
      edges {
        node {
          id
          name
          prices(first: 100, after: $pricesAfter) {
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

async function getAllPriceListsWithQuantityBreaks() {
  let allPriceLists = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await makeGraphQLRequest(GET_PRICE_LISTS_QUERY, {
      first: 10,
      after: cursor,
      pricesAfter: null
    });

    const priceLists = data.priceLists.edges;
    
    // For each price list, get ALL prices with pagination
    for (const { node: priceList } of priceLists) {
      let allPrices = [];
      let pricesHasNextPage = true;
      let pricesCursor = null;
      
      while (pricesHasNextPage) {
        const pricesData = await makeGraphQLRequest(GET_PRICE_LISTS_QUERY, {
          first: 1, // Only get this one price list
          after: null,
          pricesAfter: pricesCursor
        });
        
        // Find the current price list in the results
        const currentPriceList = pricesData.priceLists.edges.find(pl => 
          pl.node.id === priceList.id
        );
        
        if (currentPriceList) {
          const prices = currentPriceList.node.prices.edges;
          allPrices = allPrices.concat(prices);
          
          pricesHasNextPage = currentPriceList.node.prices.pageInfo.hasNextPage;
          pricesCursor = currentPriceList.node.prices.pageInfo.endCursor;
        } else {
          pricesHasNextPage = false;
        }
      }
      
      // Replace the prices in the price list with all paginated prices
      priceList.prices = {
        edges: allPrices
      };
    }
    
    allPriceLists = allPriceLists.concat(priceLists);
    
    hasNextPage = data.priceLists.pageInfo.hasNextPage;
    cursor = data.priceLists.pageInfo.endCursor;
  }
  
  // Filter price lists that have variants with quantity breaks
  const priceListsWithQuantityBreaks = allPriceLists.filter(({ node: priceList }) => {
    return priceList.prices.edges.some(({ node: price }) => 
      price.quantityPriceBreaks.edges.length > 0
    );
  });

  return priceListsWithQuantityBreaks;
}

async function convertToMetafields(priceListsWithQuantityBreaks) {
  const metafieldsToCreate = [];
  const conversionReport = [];

  for (const { node: priceList } of priceListsWithQuantityBreaks) {
    for (const { node: price } of priceList.prices.edges) {
      const variant = price.variant;
      const quantityBreaks = price.quantityPriceBreaks.edges;
      
      if (quantityBreaks.length === 0) continue;
      
      // Convert to our metafield format
      const breaks = quantityBreaks.map(({ node: qpb }) => {
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
        sku: variant.id.split('/').pop(),
        basePrice: variant.price,
        quantityBreaks: breaks.length,
        priceList: priceList.name,
        converted: true
      });
    }
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
        console.error(`Errors in batch ${i + 1}:`, result.metafieldsSet.userErrors);
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
  
  if (errorCount > 0) {
    console.log(`\nWARNING: ${errorCount} metafields failed to create. Check the errors above.`);
  }
}

async function syncPriceLists() {
  try {
    // Step 1: Get all price lists with quantity breaks
    const priceListsWithQuantityBreaks = await getAllPriceListsWithQuantityBreaks();
    
    if (priceListsWithQuantityBreaks.length === 0) {
      console.log('No price lists with quantity breaks found in your store.');
      console.log('Make sure you have quantity pricing set up in Price Lists first.');
      return;
    }

    // Step 2: Convert to metafields format
    const { metafieldsToCreate, conversionReport } = await convertToMetafields(priceListsWithQuantityBreaks);

    if (metafieldsToCreate.length === 0) {
      console.log('No variants with quantity breaks found to convert.');
      return;
    }

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

syncPriceLists();
