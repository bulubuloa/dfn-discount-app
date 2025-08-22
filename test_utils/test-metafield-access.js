#!/usr/bin/env node

/**
 * Test Metafield Access
 * 
 * Test if your current access token can create metafields
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const TEST_METAFIELD_MUTATION = `
  mutation testMetafieldAccess {
    metafieldsSet(metafields: [
      {
        namespace: "test"
        key: "access_test"
        type: "single_line_text_field"
        value: "testing access"
        ownerId: "gid://shopify/ProductVariant/43802688061613"
      }
    ]) {
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

const DELETE_TEST_METAFIELD = `
  mutation deleteTestMetafield($id: ID!) {
    metafieldDelete(input: { id: $id }) {
      deletedId
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

async function testMetafieldAccess() {
  console.log('Testing metafield write access...');
  console.log(`Store: ${SHOP_DOMAIN}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 8)}...`);
  
  try {
    // Try to create a test metafield
    console.log('\nAttempting to create test metafield...');
    const result = await makeGraphQLRequest(TEST_METAFIELD_MUTATION);
    
    if (result.metafieldsSet.userErrors && result.metafieldsSet.userErrors.length > 0) {
      console.log('Cannot create metafields:');
      result.metafieldsSet.userErrors.forEach(error => {
        console.log(`   Error: ${error.message}`);
      });
      
      console.log('\nSOLUTION OPTIONS:');
      console.log('1. Get a new access token with metafield permissions');
      console.log('2. Use the manual GraphiQL method from BTSF-011-MANUAL-FIX.md');
      console.log('3. Add metafields through Shopify Admin UI');
      
      return false;
    } else {
      console.log('Successfully created test metafield!');
      
      // Clean up the test metafield
      const metafieldId = result.metafieldsSet.metafields[0].id;
      console.log('Cleaning up test metafield...');
      
      try {
        await makeGraphQLRequest(DELETE_TEST_METAFIELD, { id: metafieldId });
        console.log('Test metafield cleaned up');
      } catch (cleanupError) {
        console.log('Could not clean up test metafield, but creation worked');
      }
      
      console.log('\nYour access token has metafield permissions!');
      console.log('You can run the sync script to fix BTSF 011 products');
      
      return true;
    }
    
  } catch (error) {
    console.error('Error testing metafield access:', error.message);
    
    if (error.message.includes('ACCESS_DENIED')) {
      console.log('\nACCESS DENIED - You need metafield permissions');
      console.log('Try one of these solutions:');
      console.log('1. Generate a new access token');
      console.log('2. Use the manual GraphiQL method');
      console.log('3. Use Shopify Admin UI to add metafields');
    }
    
    return false;
  }
}

console.log(`
METAFIELD ACCESS TEST
========================

This will test if your current access token can create metafields
on product variants. If yes, we can run the sync script to fix
the missing BTSF 011 metafields automatically.
`);

testMetafieldAccess().then(hasAccess => {
  if (hasAccess) {
    console.log('\nNEXT STEP: Run the sync script to fix BTSF 011');
    console.log('   node check-btsf-011.js');
  }
});
