#!/usr/bin/env node

/**
 * Test Sync Script
 * 
 * A simple test to verify the sync works before running on all products
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const TEST_QUERY = `
  query testConnection {
    shop {
      id
      name
      myshopifyDomain
    }
    productVariants(first: 5) {
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
            title
          }
        }
      }
    }
  }
`;

async function testConnection() {
      console.log('Testing connection to Shopify...');
  
  try {
    const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN,
      },
      body: JSON.stringify({ query: TEST_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    const shop = data.data.shop;
    const variants = data.data.productVariants.edges;

    console.log('Connection successful!');
    console.log(`Store: ${shop.name} (${shop.myshopifyDomain})`);
    console.log(`Sample variants found: ${variants.length}`);
    
    const variantsWithBreaks = variants.filter(({ node }) => 
      node.contextualPricing && 
      node.contextualPricing.quantityPriceBreaks &&
      node.contextualPricing.quantityPriceBreaks.edges.length > 0
    );

    console.log(`Variants with quantity breaks: ${variantsWithBreaks.length}`);
    
    if (variantsWithBreaks.length > 0) {
      console.log('\nSample quantity breaks found:');
      variantsWithBreaks.forEach(({ node }) => {
        console.log(`\n${node.product.title} - ${node.title} (${node.sku})`);
        console.log(`   Base price: $${node.price}`);
        node.contextualPricing.quantityPriceBreaks.edges.forEach(({ node: qpb }) => {
          console.log(`   - ${qpb.minimumQuantity}+ items at $${qpb.price.amount}`);
        });
      });
      
      console.log('\nReady to sync! Run: node sync-all-products.js');
    } else {
      console.log('\nNo quantity breaks found in sample.');
      console.log('Make sure you have quantity pricing set up on some products.');
      console.log('You can still run the full sync to check all products.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your SHOPIFY_SHOP_DOMAIN is correct');
    console.log('2. Check your SHOPIFY_ACCESS_TOKEN is valid');
    console.log('3. Ensure your token has read_products scope');
  }
}

console.log(`
SYNC TEST TOOL
=================

Testing connection and looking for products with quantity breaks...
Store: ${SHOP_DOMAIN}
Token: ${ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 8) + '...' : 'NOT SET'}
`);

testConnection();
