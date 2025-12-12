import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import InventoryLog from '../models/InventoryLog';

const router = Router();

router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await InventoryLog.find()
      .sort({ processedAt: -1 })
      .limit(100);
    
    res.json({ data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory logs' });
  }
});

export default router;

