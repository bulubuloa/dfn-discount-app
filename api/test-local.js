import healthHandler from './dist/api/health.js';
import shopifyFunctionsHandler from './dist/api/shopify-functions.js';
import createDiscountHandler from './dist/api/create-discount-automatic.js';
import discountWorkflowHandler from './dist/api/discount-workflow.js';
import testGraphQLHandler from './dist/api/test-graphql.js';

// Mock Vercel request/response objects
const createMockReq = (method = 'GET', body = {}) => ({
  method,
  body,
  headers: {},
  url: '/api/test'
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
      console.log(`Response (${this.statusCode}): [CORS preflight]`);
      return this;
    }
  };
  return res;
};

// Test all endpoints
console.log('🧪 Testing API endpoints locally...\n');

// Test health endpoint
console.log('1. Testing /api/health:');
const healthReq = createMockReq('GET');
const healthRes = createMockRes();
healthHandler(healthReq, healthRes);

console.log('\n2. Testing /api/shopify-functions:');
const shopifyReq = createMockReq('GET');
const shopifyRes = createMockRes();
shopifyFunctionsHandler(shopifyReq, shopifyRes);

console.log('\n3. Testing /api/create-discount-automatic:');
const createReq = createMockReq('POST', { functionId: 'test-123', title: 'Test Discount' });
const createRes = createMockRes();
createDiscountHandler(createReq, createRes);

console.log('\n4. Testing /api/discount-workflow:');
const workflowReq = createMockReq('POST', { title: 'Test Workflow' });
const workflowRes = createMockRes();
discountWorkflowHandler(workflowReq, workflowRes);

console.log('\n5. Testing /api/test-graphql:');
const graphqlReq = createMockReq('GET');
const graphqlRes = createMockRes();
testGraphQLHandler(graphqlReq, graphqlRes);

console.log('\n✅ All tests completed!');
