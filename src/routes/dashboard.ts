import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vendor from '../models/Vendor';
import Driver from '../models/Driver';
import Microhub from '../models/Microhub';
import Order from '../models/Order';
import InventoryLog from '../models/InventoryLog';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const activeVendors = await Vendor.countDocuments({ status: 'approved' });
    const totalDeliveries = await Order.countDocuments();
    const activeDrivers = await Driver.countDocuments({ status: 'active' });
    const microhubs = await Microhub.countDocuments();
    
    const allOrders = await Order.find();
    const deliveredOrders = allOrders.filter(o => o.status === 'Completed');
    const averageDeliveryTimeHours = deliveredOrders.length > 0 ? 2.5 : 0;
    const successRate = deliveredOrders.length > 0 
      ? Math.round((deliveredOrders.length / allOrders.length) * 100) 
      : 0;

    const recentLogs = await InventoryLog.find()
      .sort({ processedAt: -1 })
      .limit(10);

    const activities = recentLogs.map(log => ({
      id: log._id.toString(),
      vendor: log.vendor,
      action: `${log.type} ${log.quantity} units of ${log.product}`,
      time: log.processedAt.toISOString(),
      status: 'completed',
    }));

    res.json({
      metrics: {
        activeVendors,
        totalDeliveries,
        activeDrivers,
        microhubs,
        averageDeliveryTimeHours,
        successRate,
      },
      activities,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

export default router;

