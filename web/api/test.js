export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.status(200).json({
      message: 'API is working correctly!',
      timestamp: new Date().toISOString(),
      status: 'success',
      endpoints: {
        test: '/api/test',
        getFunctionId: '/api/get-function-id',
        graphiqlSetup: '/graphiql-setup'
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
