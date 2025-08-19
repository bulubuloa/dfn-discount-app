import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Discount workflow executed successfully',
    data: {
      workflowId: 'workflow-123',
      status: 'completed'
    }
  });
}
