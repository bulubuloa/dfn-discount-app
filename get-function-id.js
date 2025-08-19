// Helper script to get Function ID
// Run this with: node get-function-id.js

const { GraphQLClient, gql } = require('graphql-request');

// You'll need to get these from your Shopify app
const SHOP_DOMAIN = 'your-shop.myshopify.com';
const ACCESS_TOKEN = 'your-access-token';

const client = new GraphQLClient(`https://${SHOP_DOMAIN}/admin/api/2025-04/graphql.json`, {
  headers: {
    'X-Shopify-Access-Token': ACCESS_TOKEN,
  },
});

const GET_FUNCTIONS = gql`
  query {
    shopifyFunctions(first: 25) {
      nodes {
        app {
          title
        }
        apiType
        title
        id
      }
    }
  }
`;

const CREATE_DISCOUNT = gql`
  mutation CreateDiscount($functionId: ID!, $title: String!) {
    discountAutomaticAppCreate(
      automaticAppDiscount: {
        title: $title
        functionId: $functionId
        discountClasses: [PRODUCT, ORDER, SHIPPING]
        startsAt: "2025-01-01T00:00:00"
      }
    ) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function getFunctionId() {
  try {
    const data = await client.request(GET_FUNCTIONS);
    console.log('Available Functions:');
    data.shopifyFunctions.nodes.forEach(func => {
      console.log(`- ${func.title} (${func.app.title}): ${func.id}`);
    });
    
    // Find our function
    const ourFunction = data.shopifyFunctions.nodes.find(
      func => func.title === 'DFN Discount App'
    );
    
    if (ourFunction) {
      console.log(`\n✅ Found our function: ${ourFunction.id}`);
      return ourFunction.id;
    } else {
      console.log('\n❌ Function not found. Make sure it\'s deployed.');
      return null;
    }
  } catch (error) {
    console.error('Error getting functions:', error);
    return null;
  }
}

async function createDiscount(functionId) {
  try {
    const variables = {
      functionId: functionId,
      title: 'DFN Discount App - 20% Off'
    };
    
    const data = await client.request(CREATE_DISCOUNT, variables);
    
    if (data.discountAutomaticAppCreate.userErrors.length > 0) {
      console.error('❌ Errors creating discount:', data.discountAutomaticAppCreate.userErrors);
    } else {
      console.log('✅ Discount created successfully!');
      console.log('Discount ID:', data.discountAutomaticAppCreate.automaticAppDiscount.discountId);
    }
  } catch (error) {
    console.error('Error creating discount:', error);
  }
}

async function main() {
  console.log('🔍 Getting Function ID...\n');
  const functionId = await getFunctionId();
  
  if (functionId) {
    console.log('\n🎯 Creating discount...\n');
    await createDiscount(functionId);
  }
}

// Run the script
main();
