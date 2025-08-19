import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { functionId, title } = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Discount created successfully',
    data: {
      functionId,
      title,
      discountId: 'gid://shopify/DiscountAutomaticApp/456'
    }
  });
}
