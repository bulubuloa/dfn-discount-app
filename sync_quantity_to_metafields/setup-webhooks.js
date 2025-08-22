#!/usr/bin/env node

/**
 * Setup Webhooks for Automatic Quantity Breaks Sync
 * 
 * This script sets up webhooks so that whenever products are updated,
 * the quantity breaks are automatically synced to metafields.
 */

// Load environment variables from .env file
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Your webhook endpoint (you'll need to implement this)
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-app.vercel.app/api/webhooks/products/update';

const CREATE_WEBHOOK_MUTATION = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        callbackUrl
        topic
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_WEBHOOKS_QUERY = `
  query {
    webhookSubscriptions(first: 50) {
      edges {
        node {
          id
          callbackUrl
          topic
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

async function checkExistingWebhooks() {
  console.log(' Checking existing webhooks...');
  
  const data = await makeGraphQLRequest(GET_WEBHOOKS_QUERY);
  const webhooks = data.webhookSubscriptions.edges.map(edge => edge.node);
  
  console.log(` Found ${webhooks.length} existing webhooks:`);
  webhooks.forEach(webhook => {
    console.log(`   - ${webhook.topic}: ${webhook.callbackUrl}`);
  });

  return webhooks;
}

async function createWebhook(topic, description) {
  console.log(`\n Creating webhook for ${topic}...`);
  
  try {
    const data = await makeGraphQLRequest(CREATE_WEBHOOK_MUTATION, {
      topic: topic,
      webhookSubscription: {
        callbackUrl: WEBHOOK_URL,
        format: 'JSON'
      }
    });

    if (data.webhookSubscriptionCreate.userErrors.length > 0) {
      console.log(`  Errors creating ${topic} webhook:`, data.webhookSubscriptionCreate.userErrors);
      return false;
    } else {
      console.log(` ${description} webhook created successfully!`);
      console.log(`   ID: ${data.webhookSubscriptionCreate.webhookSubscription.id}`);
      return true;
    }
  } catch (error) {
    console.error(` Error creating ${topic} webhook:`, error.message);
    return false;
  }
}

async function setupWebhooks() {
  try {
    console.log(' Setting up webhooks for automatic quantity breaks sync...');
    console.log(` Store: ${SHOP_DOMAIN}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    
    // Check existing webhooks first
    await checkExistingWebhooks();

    // Create webhooks for product updates
    const webhooksToCreate = [
      { topic: 'PRODUCTS_UPDATE', description: 'Product Updates' },
      { topic: 'PRODUCT_VARIANTS_UPDATE', description: 'Product Variant Updates' },
    ];

    let successCount = 0;
    
    for (const { topic, description } of webhooksToCreate) {
      const success = await createWebhook(topic, description);
      if (success) successCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(' WEBHOOK SETUP SUMMARY');
    console.log('='.repeat(60));
    console.log(` Successfully created: ${successCount}/${webhooksToCreate.length} webhooks`);
    
    if (successCount === webhooksToCreate.length) {
      console.log('\n All webhooks created successfully!');
      console.log('\n Next steps:');
      console.log('1. Implement the webhook handler at:', WEBHOOK_URL);
      console.log('2. The handler should call sync-all-products.js when triggered');
      console.log('3. Test by updating a product with quantity breaks');
      console.log('\n Your quantity breaks will now sync automatically!');
    } else {
      console.log('\n  Some webhooks failed to create. Check the errors above.');
    }

  } catch (error) {
    console.error(' Error setting up webhooks:', error.message);
  }
}

// Sample webhook handler code
console.log(`
 WEBHOOK SETUP TOOL
=====================

This will create webhooks that automatically sync quantity breaks
whenever products are updated in your Shopify admin.

Sample webhook handler code for ${WEBHOOK_URL}:

\`\`\`javascript
// api/webhooks/products/update.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook (implement Shopify webhook verification)
    const product = req.body;
    console.log('Product updated:', product.title);
    
    // Trigger sync for this specific product
    // You can call your sync script or implement inline
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
\`\`\`

Starting webhook setup...
`);

setTimeout(() => {
  setupWebhooks();
}, 2000);
