# Shopify Discount Function API

This directory contains serverless API functions for managing Shopify discount functions. These functions can be deployed to Vercel and provide REST API endpoints for getting function IDs and creating automatic discounts.

## API Endpoints

### 1. Test GraphQL Connection
**GET** `/api/test-graphql`

Tests the GraphQL connection to Shopify and returns all available functions.

**Headers:**
- `x-shopify-shop-domain`: Your shop domain (e.g., `your-shop.myshopify.com`)
- `x-shopify-access-token`: Your Shopify access token

**Response:**
```json
{
  "success": true,
  "message": "GraphQL connection successful!",
  "shop": "your-shop.myshopify.com",
  "totalFunctions": 1,
  "allFunctions": [...],
  "discountFunction": {
    "app": { "title": "your-app-name-here" },
    "apiType": "discounts",
    "title": "discount-function-js",
    "id": "YOUR_FUNCTION_ID_HERE"
  }
}
```

### 2. Get Function ID
**GET** `/api/shopify-functions`

Gets the function ID using the exact GraphQL query from Shopify documentation.

**Headers:**
- `x-shopify-shop-domain`: Your shop domain
- `x-shopify-access-token`: Your Shopify access token

**Response:**
```json
{
  "success": true,
  "allFunctions": [...],
  "discountFunction": {
    "app": { "title": "your-app-name-here" },
    "apiType": "discounts",
    "title": "discount-function-js",
    "id": "YOUR_FUNCTION_ID_HERE"
  }
}
```

### 3. Create Automatic Discount
**POST** `/api/create-discount-automatic`

Creates an automatic discount using the exact mutation from Shopify documentation.

**Headers:**
- `x-shopify-shop-domain`: Your shop domain
- `x-shopify-access-token`: Your Shopify access token

**Body:**
```json
{
  "functionId": "YOUR_FUNCTION_ID_HERE",
  "title": "Cart line, Order, Shipping discount",
  "startsAt": "2025-01-01T00:00:00",
  "discountClasses": "PRODUCT, ORDER, SHIPPING"
}
```

**Response:**
```json
{
  "success": true,
  "discountId": "gid://shopify/AutomaticDiscountNode/123456789",
  "message": "Discount created successfully!"
}
```

### 4. Complete Workflow
**POST** `/api/discount-workflow`

Combines getting the function ID and creating a discount in one call.

**Headers:**
- `x-shopify-shop-domain`: Your shop domain
- `x-shopify-access-token`: Your Shopify access token

**Body:**
```json
{
  "title": "Cart line, Order, Shipping discount",
  "startsAt": "2025-01-01T00:00:00",
  "discountClasses": "PRODUCT, ORDER, SHIPPING"
}
```

**Response:**
```json
{
  "success": true,
  "workflow": {
    "step1": {
      "action": "Get Function ID",
      "status": "success",
      "functionId": "YOUR_FUNCTION_ID_HERE"
    },
    "step2": {
      "action": "Create Discount",
      "status": "success",
      "discountId": "gid://shopify/AutomaticDiscountNode/123456789"
    }
  },
  "summary": {
    "functionId": "YOUR_FUNCTION_ID_HERE",
    "discountId": "gid://shopify/AutomaticDiscountNode/123456789",
    "message": "Complete workflow executed successfully!"
  }
}
```

## GraphQL Queries Used

### Get Function ID Query
```graphql
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
```

### Create Discount Mutation
```graphql
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Cart line, Order, Shipping discount"
      functionId: "YOUR_FUNCTION_ID_HERE"
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
```

## Deployment

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Make sure your discount function is deployed to Shopify

### Deploy to Vercel

1. **Navigate to the API directory:**
   ```bash
   cd dfn-discount-app/api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - `SHOPIFY_SHOP_DOMAIN`: Your shop domain
   - `SHOPIFY_ACCESS_TOKEN`: Your Shopify access token

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export SHOPIFY_SHOP_DOMAIN="your-shop.myshopify.com"
   export SHOPIFY_ACCESS_TOKEN="your-access-token"
   ```

3. **Run locally:**
   ```bash
   vercel dev
   ```

## Usage Examples

### Using curl

1. **Test connection:**
   ```bash
   curl -X GET "https://your-vercel-app.vercel.app/api/test-graphql" \
     -H "x-shopify-shop-domain: your-shop.myshopify.com" \
     -H "x-shopify-access-token: your-access-token"
   ```

2. **Get function ID:**
   ```bash
   curl -X GET "https://your-vercel-app.vercel.app/api/shopify-functions" \
     -H "x-shopify-shop-domain: your-shop.myshopify.com" \
     -H "x-shopify-access-token: your-access-token"
   ```

3. **Create discount:**
   ```bash
   curl -X POST "https://your-vercel-app.vercel.app/api/create-discount-automatic" \
     -H "Content-Type: application/json" \
     -H "x-shopify-shop-domain: your-shop.myshopify.com" \
     -H "x-shopify-access-token: your-access-token" \
     -d '{
       "functionId": "YOUR_FUNCTION_ID_HERE",
       "title": "Test Discount",
       "startsAt": "2025-01-01T00:00:00"
     }'
   ```

4. **Complete workflow:**
   ```bash
   curl -X POST "https://your-vercel-app.vercel.app/api/discount-workflow" \
     -H "Content-Type: application/json" \
     -H "x-shopify-shop-domain: your-shop.myshopify.com" \
     -H "x-shopify-access-token: your-access-token" \
     -d '{
       "title": "Test Discount",
       "startsAt": "2025-01-01T00:00:00"
     }'
   ```

### Using JavaScript/Fetch

```javascript
// Test connection
const testResponse = await fetch('https://your-vercel-app.vercel.app/api/test-graphql', {
  headers: {
    'x-shopify-shop-domain': 'your-shop.myshopify.com',
    'x-shopify-access-token': 'your-access-token'
  }
});

// Complete workflow
const workflowResponse = await fetch('https://your-vercel-app.vercel.app/api/discount-workflow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-shopify-shop-domain': 'your-shop.myshopify.com',
    'x-shopify-access-token': 'your-access-token'
  },
  body: JSON.stringify({
    title: 'Test Discount',
    startsAt: '2025-01-01T00:00:00'
  })
});
```

## Troubleshooting

### Common Issues

1. **Function not found:**
   - Make sure your discount function is deployed
   - Verify the function title is exactly "discount-function-js"
   - Check that the function has apiType "discounts"

2. **Authentication errors:**
   - Verify your access token is valid
   - Check that the shop domain is correct
   - Ensure the token has the necessary permissions

3. **GraphQL errors:**
   - Check the Shopify API version (currently using 2024-01)
   - Verify the mutation syntax
   - Check for any required fields that might be missing

### Manual Testing with GraphiQL

If the API fails, you can test manually:

1. Press "g" in your terminal where the app is running
2. Run the shopifyFunctions query to get your function ID
3. Use the discountAutomaticAppCreate mutation with your function ID

## Environment Variables

- `SHOPIFY_SHOP_DOMAIN`: Your Shopify shop domain (e.g., `your-shop.myshopify.com`)
- `SHOPIFY_ACCESS_TOKEN`: Your Shopify access token with admin permissions

## Notes

- All functions use the exact GraphQL queries and mutations from Shopify documentation
- Functions are designed to work with the "discount-function-js" function title
- The API supports both environment variables and request headers for authentication
- All responses include detailed error messages and fallback instructions
