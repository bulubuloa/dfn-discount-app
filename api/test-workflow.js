import discountWorkflowHandler from './dist/api/discount-workflow.js';

// Mock Vercel request/response objects
const createMockReq = (method = 'POST', body = {}, headers = {}) => ({
  method,
  body,
  headers: {
    'content-type': 'application/json',
    'x-shopify-shop-domain': 'test-shop.myshopify.com',
    ...headers
  },
  url: '/api/discount-workflow'
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

// Test discount workflow
console.log('🧪 Testing discount workflow...\n');

console.log('Testing POST request to /api/discount-workflow:');
const workflowReq = createMockReq('POST', { 
  title: 'Test Discount', 
  startsAt: new Date().toISOString(),
  discountClasses: 'PRODUCT, ORDER, SHIPPING'
});
const workflowRes = createMockRes();
await discountWorkflowHandler(workflowReq, workflowRes);

console.log('\n✅ Workflow test completed!');
