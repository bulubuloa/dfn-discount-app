import discountWorkflowHandler from '../dist/api/discount-workflow.js';

// Mock Vercel request/response objects
const createMockReq = (method = 'OPTIONS') => ({
  method,
  body: {},
  headers: {
    'origin': 'https://dfn-discount-app-frontend.vercel.app',
    'access-control-request-method': 'POST',
    'access-control-request-headers': 'Content-Type, Authorization, x-shopify-shop-domain'
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
      console.log(`Set header: ${name} = ${value}`);
      return this;
    },
    json: function(data) {
      this.body = data;
      console.log(`Response (${this.statusCode}):`, JSON.stringify(data, null, 2));
      return this;
    },
    end: function() {
      console.log(`Response (${this.statusCode}): [CORS preflight completed]`);
      console.log('Headers set:', this.headers);
      return this;
    }
  };
  return res;
};

// Test CORS preflight
console.log(' Testing CORS preflight request...\n');

console.log('Testing OPTIONS request to /api/discount-workflow:');
const optionsReq = createMockReq('OPTIONS');
const optionsRes = createMockRes();
discountWorkflowHandler(optionsReq, optionsRes);

console.log('\n CORS test completed!');
