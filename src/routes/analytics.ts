import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';

const router = Router();

import mongoose from 'mongoose';

router.get('/vendor/sales', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    // Generate last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      // Get orders for this month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const orders = await Order.find({
        vendorId: new mongoose.Types.ObjectId(req.vendorId),
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const sales = orders.reduce((sum, order) => sum + order.total, 0);
      
      months.push({
        month: monthName,
        sales: Math.round(sales),
        orders: orders.length,
      });
    }

    res.json({ data: months });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales analytics' });
  }
});

router.get('/vendor/categories', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const products = await Product.find({ 
      vendorId: new mongoose.Types.ObjectId(req.vendorId) 
    });
    
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      const current = categoryMap.get(product.category) || 0;
      categoryMap.set(product.category, current + (product.price * product.stock));
    });

    const data = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category analytics' });
  }
});

router.get('/vendor/fulfillment', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    // Generate last 7 days of data
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleString('default', { weekday: 'short' });
      
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const orders = await Order.find({
        vendorId: new mongoose.Types.ObjectId(req.vendorId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const fulfilled = orders.filter(o => o.status === 'Delivered').length;
      const pending = orders.filter(o => o.status !== 'Delivered').length;
      
      days.push({
        day: dayName,
        fulfilled,
        pending,
      });
    }

    res.json({ data: days });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch fulfillment analytics' });
  }
});

export default router;

