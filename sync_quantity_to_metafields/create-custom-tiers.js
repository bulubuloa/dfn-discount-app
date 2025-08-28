#!/usr/bin/env node

/**
 * Create Custom Pricing Tiers for BTSF 011
 * Since these products don't have Shopify native quantity breaks,
 * we need to manually create metafields with the custom pricing structure
 */

import dotenv from 'dotenv';
dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// BTSF 011 Custom Pricing Tiers (from product page)
const BTSF_011_TIERS = {
  // XS-XL sizes
  "xs-xl": {
    fixed: "31.95",
    breaks: [
      { min: 10, price: "27.50" },
      { min: 50, price: "24.20" },
      { min: 150, price: "21.75" }
    ]
  },
  // 2XL-4XL sizes  
  "2xl-4xl": {
    fixed: "35.95",
    breaks: [
      { min: 10, price: "29.50" },
      { min: 50, price: "27.20" },
      { min: 150, price: "25.75" }
    ]
  }
};

// Query to get BTSF 011 product variants
const GET_BTSF_011_VARIANTS_QUERY = `
  query getBTSF011Variants {
    products(query: "BTSF 011", first: 5) {
      edges {
        node {
          id
          title
          variants(first: 20) {
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
              }
            }
          }
        }
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

function determineSizeCategory(variantTitle) {
  const title = variantTitle.toLowerCase();
  
  // Check if it's 2XL or larger
  if (title.includes('2xl') || title.includes('3xl') || title.includes('4xl')) {
    return '2xl-4xl';
  }
  
  // Default to XS-XL for all other sizes
  return 'xs-xl';
}

async function createCustomTiersForBTSF011() {
  console.log('🔄 Creating custom pricing tiers for BTSF 011...');
  
  // Get BTSF 011 variants
  const data = await makeGraphQLRequest(GET_BTSF_011_VARIANTS_QUERY);
  
  if (data.products.edges.length === 0) {
    console.log('❌ BTSF 011 product not found');
    return;
  }
  
  const product = data.products.edges[0].node;
  console.log(`📦 Product: ${product.title}`);
  
  const metafieldsToCreate = [];
  const report = [];
  
  for (const { node: variant } of product.variants.edges) {
    // Skip if already has metafield
    if (variant.metafields.edges.length > 0) {
      console.log(`⏭️  ${variant.title} (${variant.sku}) - Already has metafield`);
      continue;
    }
    
    // Determine size category and pricing
    const sizeCategory = determineSizeCategory(variant.title);
    const pricingTiers = BTSF_011_TIERS[sizeCategory];
    
    console.log(`\n📝 Processing: ${variant.title} (${variant.sku})`);
    console.log(`   Size category: ${sizeCategory}`);
    console.log(`   Base price: $${variant.price}`);
    console.log(`   Custom tiers: ${pricingTiers.breaks.length}`);
    
    pricingTiers.breaks.forEach(tier => {
      console.log(`     ${tier.min}+ items at $${tier.price} each`);
    });
    
    // Create metafield input
    const metafieldInput = {
      namespace: "qbtier",
      key: "tiers",
      type: "json",
      value: JSON.stringify(pricingTiers),
      ownerId: variant.id
    };
    
    metafieldsToCreate.push(metafieldInput);
    
    report.push({
      variant: variant.title,
      sku: variant.sku,
      sizeCategory,
      basePrice: variant.price,
      customTiers: pricingTiers.breaks.length,
      willCreate: true
    });
  }
  
  if (metafieldsToCreate.length === 0) {
    console.log('\n✅ All BTSF 011 variants already have metafields!');
    return;
  }
  
  console.log(`\n🔄 Creating ${metafieldsToCreate.length} metafields...`);
  
  // Create metafields in batches
  const BATCH_SIZE = 25;
  const batches = [];
  
  for (let i = 0; i < metafieldsToCreate.length; i += BATCH_SIZE) {
    batches.push(metafieldsToCreate.slice(i, i + BATCH_SIZE));
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} metafields)...`);
    
    try {
      const result = await makeGraphQLRequest(CREATE_METAFIELDS_MUTATION, {
        metafields: batch
      });

      if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
        console.log(`❌ Errors in batch ${i + 1}:`, result.metafieldsSet.userErrors);
        errorCount += result.metafieldsSet.userErrors.length;
      } else {
        console.log(`✅ Batch ${i + 1} completed successfully`);
        successCount += batch.length;
      }
    } catch (error) {
      console.error(`❌ Error processing batch ${i + 1}:`, error.message);
      errorCount += batch.length;
    }

    // Add delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('CUSTOM TIERS CREATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\nStatistics:`);
  console.log(`   Total variants processed: ${report.length}`);
  console.log(`   Metafields created successfully: ${successCount}`);
  console.log(`   Errors encountered: ${errorCount}`);
  
  console.log(`\nVariants with custom pricing tiers:`);
  report.forEach(item => {
    console.log(`   - ${item.variant} (${item.sku}): ${item.sizeCategory} pricing`);
  });
  
  if (successCount > 0) {
    console.log(`\n🎉 BTSF 011 products now have custom pricing tiers!`);
    console.log(`Your Shopify Functions can now access quantity break data for these products.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createCustomTiersForBTSF011().catch(console.error);
}

