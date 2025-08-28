#!/usr/bin/env node

/**
 * Monitor Quantity Break Sync Status
 * This script checks which products have metafields and which don't
 */

import dotenv from 'dotenv';
dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const MONITOR_QUERY = `
  query getProductsWithMetafields($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          variants(first: 10) {
            edges {
              node {
                id
                sku
                title
                metafields(namespace: "qbtier", first: 1) {
                  edges {
                    node {
                      id
                      value
                    }
                  }
                }
                contextualPricing(context: {}) {
                  quantityPriceBreaks(first: 1) {
                    edges {
                      node {
                        minimumQuantity
                        price {
                          amount
                        }
                      }
                    }
                  }
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

async function monitorSyncStatus() {
  console.log('🔍 Monitoring quantity break sync status...');
  
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}...`);
    
    const data = await makeGraphQLRequest(MONITOR_QUERY, {
      first: 50,
      after: cursor
    });

    const products = data.products.edges;
    allProducts = allProducts.concat(products);
    
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  console.log(`\n📊 Sync Status Report`);
  console.log(`=====================`);
  console.log(`Total products: ${allProducts.length}`);

  let totalVariants = 0;
  let variantsWithQB = 0;
  let variantsWithMetafields = 0;
  let variantsNeedingSync = 0;

  const report = [];

  for (const { node: product } of allProducts) {
    for (const { node: variant } of product.variants.edges) {
      totalVariants++;
      
      const hasQuantityBreaks = variant.contextualPricing?.quantityPriceBreaks?.edges?.length > 0;
      const hasMetafields = variant.metafields?.edges?.length > 0;
      
      if (hasQuantityBreaks) variantsWithQB++;
      if (hasMetafields) variantsWithMetafields++;
      if (hasQuantityBreaks && !hasMetafields) variantsNeedingSync++;
      
      if (hasQuantityBreaks) {
        report.push({
          product: product.title,
          variant: variant.title,
          sku: variant.sku,
          hasQB: hasQuantityBreaks,
          hasMetafield: hasMetafields,
          needsSync: hasQuantityBreaks && !hasMetafields
        });
      }
    }
  }

  console.log(`Total variants: ${totalVariants}`);
  console.log(`Variants with quantity breaks: ${variantsWithQB}`);
  console.log(`Variants with metafields: ${variantsWithMetafields}`);
  console.log(`Variants needing sync: ${variantsNeedingSync}`);
  
  if (variantsNeedingSync > 0) {
    console.log(`\n⚠️  Products needing sync:`);
    report.filter(r => r.needsSync).forEach(r => {
      console.log(`   - ${r.product} > ${r.variant} (${r.sku})`);
    });
    
    console.log(`\n🔄 Run sync to fix: node sync-all-products.js`);
  } else {
    console.log(`\n✅ All products are synced!`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  monitorSyncStatus().catch(console.error);
}
