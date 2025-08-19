export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, message, config } = req.body;

    // Provide the exact GraphQL queries for manual execution
    const instructions = {
      message: 'Copy and paste these queries into GraphiQL (press "g" in your terminal):',
      steps: [
        {
          step: 1,
          title: 'Get Function ID',
          description: 'Run this query in GraphiQL to get your function ID:',
          query: `query {
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
}`,
          note: 'Copy the "id" value from the response'
        },
        {
          step: 2,
          title: 'Create Discount',
          description: 'Replace YOUR_FUNCTION_ID_HERE with the ID from step 1, then run this mutation:',
          query: `mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "${title || 'DFN Auto Discount'}"
      functionId: "YOUR_FUNCTION_ID_HERE"
      discountClasses: [PRODUCT, ORDER, SHIPPING]
      startsAt: "${new Date().toISOString()}"
    }
  ) {
    automaticAppDiscount {
      discountId
      title
      status
    }
    userErrors {
      field
      message
    }
  }
}`,
          note: 'If successful, you\'ll see a discountId in the response'
        }
      ],
      config: config || {},
      quickStart: {
        message: 'Quick Start:',
        instructions: [
          '1. Press "g" in your terminal to open GraphiQL',
          '2. Copy the first query above and run it',
          '3. Copy the function ID from the response',
          '4. Replace "YOUR_FUNCTION_ID_HERE" in the second query with your function ID',
          '5. Run the second query to create the discount'
        ]
      }
    };

    res.status(200).json({
      success: true,
      instructions,
      message: 'GraphQL queries ready for manual execution'
    });

  } catch (error) {
    console.error('Error generating instructions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
