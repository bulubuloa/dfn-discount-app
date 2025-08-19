import shopify from "../shopify.js";

const GET_FUNCTIONS = `
  query getFunctions {
    shopifyFunctions(first: 10) {
      nodes {
        id
        title
        apiType
        app {
          title
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use the authenticated session from the Shopify app
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    // Get functions
    const data = await client.request(GET_FUNCTIONS);
    
    // Find our function
    const ourFunction = data.shopifyFunctions.nodes.find(
      func => func.title === 'DFN Discount App' || func.title === 'discount-function'
    );

    if (!ourFunction) {
      return res.status(404).json({ error: 'Function not found. Make sure the function is deployed.' });
    }

    return res.status(200).json({ 
      functionId: ourFunction.id,
      functionTitle: ourFunction.title,
      apiType: ourFunction.apiType
    });

  } catch (error) {
    console.error('Error getting function ID:', error);
    return res.status(500).json({ 
      error: 'Failed to get function ID',
      details: error.message 
    });
  }
}
