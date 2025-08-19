import shopify from "../shopify.js";

const CREATE_DISCOUNT = `
  mutation createAutomaticDiscount($input: AutomaticDiscountInput!) {
    automaticDiscountCreate(input: $input) {
      automaticDiscount {
        id
        title
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { functionId, title, message, config } = req.body;

    if (!functionId || !title) {
      return res.status(400).json({ error: 'Missing required fields: functionId, title' });
    }

    // Use the authenticated session from the Shopify app
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    // Prepare the discount input
    const discountInput = {
      title: title,
      message: message || "🎉 Special discount applied automatically!",
      functionId: functionId,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      customerGets: {
        value: {
          percentage: 0 // The function will handle the actual discount logic
        },
        items: {
          all: true
        }
      },
      customerSelection: {
        all: true
      },
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToAmount: config?.minimumOrderAmount || 0
        }
      }
    };

    // Create the discount
    const data = await client.request(CREATE_DISCOUNT, {
      input: discountInput
    });

    if (data.automaticDiscountCreate.userErrors.length > 0) {
      const errors = data.automaticDiscountCreate.userErrors.map(err => `${err.field}: ${err.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Failed to create discount',
        details: errors 
      });
    }

    const discount = data.automaticDiscountCreate.automaticDiscount;

    return res.status(200).json({ 
      success: true,
      discountId: discount.id,
      discountTitle: discount.title,
      status: discount.status,
      message: 'Discount created successfully!'
    });

  } catch (error) {
    console.error('Error creating discount:', error);
    return res.status(500).json({ 
      error: 'Failed to create discount',
      details: error.message 
    });
  }
}
