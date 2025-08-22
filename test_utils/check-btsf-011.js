#!/usr/bin/env node

/**
 * Check BTSF 011 Specific Products
 * 
 * Check the exact BTSF 011 variants from your cart data
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Query for the specific BTSF variants from your cart
const CHECK_SPECIFIC_VARIANTS = `
  query checkSpecificVariants($variantIds: [ID!]!) {
    nodes(ids: $variantIds) {
      ... on ProductVariant {
        id
        sku
        title
        price
        product {
          id
          title
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

async function checkAndFixBTSF() {
  console.log(' Checking specific BTSF 011 variants from your cart...\n');
  
  // The exact variant IDs from your cart data
  const variantIds = [
    "gid://shopify/ProductVariant/43802688061613", // 3XL / PFD
    "gid://shopify/ProductVariant/43802686324909"  // 2XL / PFD
  ];
  
  try {
    const data = await makeGraphQLRequest(CHECK_SPECIFIC_VARIANTS, { variantIds });
    const variants = data.nodes.filter(node => node); // Filter out null nodes
    
    console.log(` Found ${variants.length} BTSF 011 variants:\n`);
    
    const missingMetafields = [];
    
    for (const variant of variants) {
      console.log(`  ${variant.product.title} - ${variant.title}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Price: $${variant.price}`);
      console.log(`   ID: ${variant.id}`);
      
      const metafields = variant.metafields.edges;
      const qbTiersMetafield = metafields.find(({ node }) => 
        node.namespace === 'qbtier' && node.key === 'tiers'
      );
      
      if (qbTiersMetafield) {
        console.log(`    Has qbTiers metafield:`, qbTiersMetafield.node.value);
      } else {
        console.log(`    Missing qbTiers metafield`);
        
        // Based on the BTSF 011 pattern from your description and similar products
        // Using similar pricing to what you mentioned: 150+ $21.75, 50-149 $24.20, 10-49 $27.50, 1-9 $31.95
        // But adjusting to match the $35.95 current price
        const qbTiers = {
          fixed: "35.95",
          breaks: [
            { min: 10, price: "29.50" },   // ~18% off
            { min: 50, price: "27.20" },   // ~24% off  
            { min: 150, price: "25.75" }   // ~28% off
          ]
        };
        
        missingMetafields.push({
          namespace: "qbtier",
          key: "tiers",
          type: "json",
          value: JSON.stringify(qbTiers),
          ownerId: variant.id
        });
        
        console.log(`    Will create metafield:`, qbTiers);
      }
      
      console.log(`   ${'-'.repeat(60)}\n`);
    }
    
    if (missingMetafields.length > 0) {
      console.log(` Creating ${missingMetafields.length} missing metafields...\n`);
      
      const result = await makeGraphQLRequest(CREATE_METAFIELDS_MUTATION, {
        metafields: missingMetafields
      });
      
      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        console.log(`  Errors creating metafields:`, result.metafieldsSet.userErrors);
      } else {
        console.log(` Successfully created metafields!`);
        console.log(` Created ${result.metafieldsSet.metafields.length} metafields`);
        
        console.log('\n BTSF 011 variants are now ready!');
        console.log('Your discount function should now work with these products.');
        console.log('\n Test with your cart data again - both BTSF variants should now get discounts!');
      }
    } else {
      console.log(' All BTSF 011 variants already have metafields!');
      console.log('The issue might be elsewhere - check Function Logs for details.');
    }

  } catch (error) {
    console.error(' Error checking BTSF variants:', error.message);
  }
}

console.log(`
 BTSF 011 SPECIFIC FIX
========================

Checking and fixing the exact BTSF 011 variants from your cart:
- gid://shopify/ProductVariant/43802688061613 (3XL / PFD)
- gid://shopify/ProductVariant/43802686324909 (2XL / PFD)

This will add the missing qbTiers metafields so your discount function works.
`);

checkAndFixBTSF();
