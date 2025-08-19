import express from 'express';
import cors from 'cors';
import { shopifyFunctionsHandler } from './routes/shopify-functions';
import { createDiscountHandler } from './routes/create-discount';
import { discountWorkflowHandler } from './routes/discount-workflow';
import { testGraphQLHandler } from './routes/test-graphql';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/shopify-functions', shopifyFunctionsHandler);
app.post('/api/create-discount-automatic', createDiscountHandler);
app.post('/api/discount-workflow', discountWorkflowHandler);
app.get('/api/test-graphql', testGraphQLHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test-graphql',
      'GET /api/shopify-functions',
      'POST /api/create-discount-automatic',
      'POST /api/discount-workflow'
    ]
  });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Test GraphQL: http://localhost:${PORT}/api/test-graphql`);
  });
}

// Export for Vercel
export default app;
