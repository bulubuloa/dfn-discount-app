import shopifyRealHandler from '../dist/api/shopify-real.js';

// Mock Vercel request/response objects
const createMockReq = (method = 'POST', body = {}, headers = {}) => ({
  method,
  body,
  headers: {
    'content-type': 'application/json',
    'x-shopify-shop-domain': 'test-shop.myshopify.com',
    'x-shopify-access-token': 'test-access-token',
    ...headers
  },
  url: '/api/shopify-real'
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    },
    json: function(data) {
      this.body = data;
      console.log(`Response (${this.statusCode}):`, JSON.stringify(data, null, 2));
      return this;
    },
    end: function() {
      console.log(`Response (${this.statusCode}): [CORS preflight completed]`);
      return this;
    }
  };
  return res;
};

// Test the new Shopify real API
console.log(' Testing new Shopify real API...\n');

console.log('Testing POST request to /api/shopify-real:');
const shopifyReq = createMockReq('POST', { 
  title: 'Test Discount', 
  startsAt: new Date().toISOString(),
  discountClasses: 'PRODUCT, ORDER, SHIPPING'
});
const shopifyRes = createMockRes();

// This will fail because we don't have real Shopify credentials, but it should handle the error gracefully
try {
  await shopifyRealHandler(shopifyReq, shopifyRes);
} catch (error) {
  console.log('Expected error (no real Shopify credentials):', error.message);
}

console.log('\n Shopify real API test completed!');
