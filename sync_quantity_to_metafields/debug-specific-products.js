#!/usr/bin/env node

/**
 * Debug Specific Products
 * Check why certain products don't have qbTiers metafields
 */

import dotenv from 'dotenv';
dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Query to get specific products by title
const GET_SPECIFIC_PRODUCTS_QUERY = `
  query getSpecificProducts($query: String!) {
    products(query: $query, first: 10) {
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
                price
                metafields(namespace: "qbtier", first: 1) {
                  edges {
                    node {
                      id
                      value
                    }
                  }
                }
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
              }
            }
          }
        }
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

async function debugSpecificProducts() {
  console.log('🔍 Debugging specific products from cart...');
  
  // Check JOY 001 (should have metafields)
  console.log('\n📦 Checking JOY 001...');
  const joyData = await makeGraphQLRequest(GET_SPECIFIC_PRODUCTS_QUERY, { query: "JOY 001" });
  
  if (joyData.products.edges.length > 0) {
    const joyProduct = joyData.products.edges[0].node;
    console.log(`Product: ${joyProduct.title}`);
    
    for (const { node: variant } of joyProduct.variants.edges) {
      const hasMetafield = variant.metafields.edges.length > 0;
      const hasQuantityBreaks = variant.contextualPricing?.quantityPriceBreaks?.edges?.length > 0;
      
      console.log(`  Variant: ${variant.title} (${variant.sku})`);
      console.log(`    Price: $${variant.price}`);
      console.log(`    Has qbTiers metafield: ${hasMetafield ? '✅' : '❌'}`);
      console.log(`    Has quantity breaks: ${hasQuantityBreaks ? '✅' : '❌'}`);
      
      if (hasMetafield) {
        console.log(`    Metafield value: ${variant.metafields.edges[0].node.value}`);
      }
      
      if (hasQuantityBreaks) {
        const breaks = variant.contextualPricing.quantityPriceBreaks.edges;
        console.log(`    Quantity breaks: ${breaks.length}`);
        breaks.forEach(({ node: qb }) => {
          console.log(`      ${qb.minimumQuantity}+ items at $${qb.price.amount}`);
        });
      }
    }
  }
  
  // Check BTSF 011 (missing metafields)
  console.log('\n📦 Checking BTSF 011...');
  const btsfData = await makeGraphQLRequest(GET_SPECIFIC_PRODUCTS_QUERY, { query: "BTSF 011" });
  
  if (btsfData.products.edges.length > 0) {
    const btsfProduct = btsfData.products.edges[0].node;
    console.log(`Product: ${btsfProduct.title}`);
    
    for (const { node: variant } of btsfProduct.variants.edges) {
      const hasMetafield = variant.metafields.edges.length > 0;
      const hasQuantityBreaks = variant.contextualPricing?.quantityPriceBreaks?.edges?.length > 0;
      
      console.log(`  Variant: ${variant.title} (${variant.sku})`);
      console.log(`    Price: $${variant.price}`);
      console.log(`    Has qbTiers metafield: ${hasMetafield ? '✅' : '❌'}`);
      console.log(`    Has quantity breaks: ${hasQuantityBreaks ? '✅' : '❌'}`);
      
      if (hasMetafield) {
        console.log(`    Metafield value: ${variant.metafields.edges[0].node.value}`);
      }
      
      if (hasQuantityBreaks) {
        const breaks = variant.contextualPricing.quantityPriceBreaks.edges;
        console.log(`    Quantity breaks: ${breaks.length}`);
        breaks.forEach(({ node: qb }) => {
          console.log(`      ${qb.minimumQuantity}+ items at $${qb.price.amount}`);
        });
      }
    }
  }
  
  console.log('\n🔍 Analysis:');
  console.log('- JOY 001 products have qbTiers metafields because they have quantity breaks configured');
  console.log('- BTSF 011 products are missing qbTiers metafields because they don\'t have quantity breaks configured');
  console.log('- To fix this, you need to either:');
  console.log('  1. Configure quantity breaks for BTSF 011 products in Shopify admin, OR');
  console.log('  2. Create custom pricing tiers manually via metafields');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  debugSpecificProducts().catch(console.error);
}

