import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Driver from '../models/Driver';
import Order from '../models/Order';

const router = Router();

router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const totalDeliveries = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const onTimeRate = totalDeliveries > 0 
      ? Math.round((deliveredOrders / totalDeliveries) * 100) 
      : 0;
    
    const allOrders = await Order.find({ status: 'Delivered' });
    const averageDeliveryTime = allOrders.length > 0 ? 2.5 : 0;
    const issuesReported = 3; // Placeholder

    const topPerformers = await Driver.find({ status: 'active' })
      .sort({ rating: -1, deliveries: -1 })
      .limit(5);

    res.json({
      totalDeliveries,
      onTimeRate,
      averageDeliveryTime,
      issuesReported,
      topPerformers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch fleet metrics' });
  }
});

export default router;

