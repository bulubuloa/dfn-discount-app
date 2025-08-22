#!/usr/bin/env node

/**
 * Sync Quantity Price Breaks from Admin API to Metafields
 * 
 * This script uses the Admin API to fetch quantityPriceBreaks and 
 * converts them to metafields that Shopify Functions can access.
 */

const ADMIN_API_QUERY = `
  query getProductVariantsWithQuantityBreaks($first: Int!) {
    productVariants(first: $first) {
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

async function syncQuantityBreaksToMetafields(shopDomain, accessToken) {
  console.log(' Starting sync of quantity breaks to metafields...');
  
  // Step 1: Fetch all variants with quantity breaks using Admin API
  const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: ADMIN_API_QUERY,
      variables: { first: 100 }
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const variants = data.data.productVariants.edges;
  console.log(` Found ${variants.length} variants to process`);

  // Step 2: Convert quantity breaks to metafield format
  const metafieldsToCreate = [];

  for (const { node: variant } of variants) {
    if (variant.quantityPriceBreaks && variant.quantityPriceBreaks.length > 0) {
      console.log(`Processing ${variant.sku}: ${variant.quantityPriceBreaks.length} quantity breaks`);
      
      // Convert to our metafield format
      const qbTiers = {
        fixed: variant.price,
        breaks: variant.quantityPriceBreaks.map(qpb => ({
          min: parseInt(qpb.minimumQuantity),
          price: qpb.price.amount
        }))
      };

      metafieldsToCreate.push({
        namespace: "qbtier",
        key: "tiers",
        type: "json",
        value: JSON.stringify(qbTiers),
        ownerId: variant.id
      });
    }
  }

  // Step 3: Create metafields using Admin API
  if (metafieldsToCreate.length > 0) {
    console.log(` Creating ${metafieldsToCreate.length} metafields...`);
    
    const metafieldResponse = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: METAFIELD_MUTATION,
        variables: { metafields: metafieldsToCreate }
      }),
    });

    const metafieldData = await metafieldResponse.json();
    
    if (metafieldData.errors) {
      throw new Error(`Metafield creation errors: ${JSON.stringify(metafieldData.errors)}`);
    }

    console.log(' Sync completed successfully!');
    console.log(` Created metafields for ${metafieldsToCreate.length} variants`);
  } else {
    console.log('ℹ  No quantity breaks found to sync');
  }
}

// Example usage:
console.log(`
 Quantity Breaks Sync Tool

This script fetches quantityPriceBreaks from Admin API and converts them
to metafields that Shopify Functions can access.

Usage:
  node sync-quantity-breaks.js

Environment variables needed:
  SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
  SHOPIFY_ACCESS_TOKEN=your-access-token

Benefits:
 One-time setup per product
 Functions can access the data
 Automatic conversion from native pricing
 No ongoing maintenance needed
`);

// Uncomment to run:
// syncQuantityBreaksToMetafields(
//   process.env.SHOPIFY_SHOP_DOMAIN,
//   process.env.SHOPIFY_ACCESS_TOKEN
// ).catch(console.error);
