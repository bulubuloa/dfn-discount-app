import { Request, Response } from 'express';

export const createDiscountHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { functionId, title } = req.body;
    
    // Mock response for now - replace with your actual discount creation logic
    res.status(200).json({
      success: true,
      message: 'Discount created successfully',
      data: {
        functionId,
        title,
        discountId: 'gid://shopify/DiscountAutomaticApp/456'
      }
    });
  } catch (error) {
    console.error('Create Discount Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create discount'
    });
  }
};
