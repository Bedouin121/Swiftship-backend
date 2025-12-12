import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const orders = await Order.find({ 
      vendorId: new mongoose.Types.ObjectId(req.vendorId) 
    }).sort({ createdAt: -1 });
    
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

export default router;

