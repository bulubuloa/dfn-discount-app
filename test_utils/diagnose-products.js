#!/usr/bin/env node

/**
 * Diagnostic Script - Explore Product Data Structure
 * 
 * This script investigates how quantity pricing is stored in your products
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Query to explore a specific product variant structure
const EXPLORE_BTSF_QUERY = `
  query exploreBTSF {
    productVariants(first: 10, query: "sku:btsa011*") {
      edges {
        node {
          id
          sku
          title
          price
          compareAtPrice
          product {
            id
            title
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
          contextualPricing(context: {}) {
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
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
          metafields(first: 20) {
            edges {
              node {
                id
                namespace
                key
                value
                type
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

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }

  return data.data;
}

async function diagnoseBTSFProducts() {
  console.log('Diagnosing BTSF product structure...');
  console.log(`Store: ${SHOP_DOMAIN}`);
  
  try {
    const data = await makeGraphQLRequest(EXPLORE_BTSF_QUERY);
    const variants = data.productVariants.edges;

    console.log(`\nFound ${variants.length} BTSF variants`);
    
    if (variants.length === 0) {
      console.log('No BTSF variants found. Checking first few products instead...');
      
      // Fallback: check any products
      const fallbackQuery = `
        query exploreAnyProducts {
          productVariants(first: 3) {
            edges {
              node {
                id
                sku
                title
                price
                product {
                  title
                }
                contextualPricing(context: {}) {
                  quantityPriceBreaks(first: 10) {
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
                metafields(first: 10) {
                  edges {
                    node {
                      namespace
                      key
                      value
                      type
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const fallbackData = await makeGraphQLRequest(fallbackQuery);
      variants.push(...fallbackData.productVariants.edges);
    }
    
    for (const { node: variant } of variants) {
      console.log(`\n${variant.product.title} - ${variant.title}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Price: $${variant.price}`);
      
      // Check contextual pricing
      if (variant.contextualPricing) {
        const qpb = variant.contextualPricing.quantityPriceBreaks.edges;
        console.log(`   Quantity Price Breaks: ${qpb.length}`);
        
        if (qpb.length > 0) {
          console.log('   Found quantity breaks:');
          qpb.forEach(({ node }) => {
            console.log(`      - ${node.minimumQuantity}+ items at $${node.price.amount}`);
          });
        }
      }
      
      // Check metafields
      const metafields = variant.metafields.edges;
      console.log(`   Metafields: ${metafields.length}`);
      
      if (metafields.length > 0) {
        console.log('   Metafields:');
        metafields.forEach(({ node }) => {
          console.log(`      - ${node.namespace}.${node.key} (${node.type}): ${node.value.substring(0, 100)}${node.value.length > 100 ? '...' : ''}`);
        });
      }
      
      // Look for any quantity-related metafields
      const quantityMetafields = metafields.filter(({ node }) => 
        node.key.toLowerCase().includes('quantity') || 
        node.key.toLowerCase().includes('price') ||
        node.key.toLowerCase().includes('break') ||
        node.key.toLowerCase().includes('tier') ||
        node.namespace === 'qbtier'
      );
      
      if (quantityMetafields.length > 0) {
        console.log('   Quantity-related metafields:');
        quantityMetafields.forEach(({ node }) => {
          console.log(`      ${node.namespace}.${node.key}: ${node.value}`);
        });
      }
      
      console.log('   ' + '-'.repeat(60));
    }
    
    console.log('\nDIAGNOSIS SUMMARY:');
    const totalWithQuantityBreaks = variants.filter(({ node }) => 
      node.contextualPricing && 
      node.contextualPricing.quantityPriceBreaks.edges.length > 0
    ).length;
    
    const totalWithQuantityMetafields = variants.filter(({ node }) => 
      node.metafields.edges.some(({ node: meta }) => 
        meta.key.toLowerCase().includes('quantity') || 
        meta.key.toLowerCase().includes('break') ||
        meta.namespace === 'qbtier'
      )
    ).length;
    
    console.log(`Variants analyzed: ${variants.length}`);
    console.log(`With native quantity breaks: ${totalWithQuantityBreaks}`);
    console.log(`With quantity-related metafields: ${totalWithQuantityMetafields}`);
    
    if (totalWithQuantityBreaks === 0 && totalWithQuantityMetafields === 0) {
      console.log('\nRECOMMENDATIONS:');
      console.log('1. Your products might not have quantity pricing set up yet');
      console.log('2. Or quantity pricing might be stored in a different format');
      console.log('3. Check your Shopify admin to confirm quantity pricing is configured');
      console.log('4. You might need to set up quantity pricing first before syncing');
    }

  } catch (error) {
    console.error('Diagnosis failed:', error.message);
  }
}

console.log(`
PRODUCT DIAGNOSIS TOOL
=========================

This script examines your product structure to understand
how quantity pricing is stored and what metafields exist.

This will help us understand why no quantity breaks were found.
`);

diagnoseBTSFProducts();
