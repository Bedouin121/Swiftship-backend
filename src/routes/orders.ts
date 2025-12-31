import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const orders = await Order.find({ 
      vendorId: req.vendorId 
    }).sort({ createdAt: -1 });
    
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { 
      customerName, 
      microhubId, 
      productId, 
      quantity, 
      deliveryType, 
      deliveryLocation 
    } = req.body;

    if (!customerName || !microhubId || !productId || !quantity || !deliveryType || !deliveryLocation) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get product details to calculate total
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product belongs to vendor
    if (product.vendorId.toString() !== req.vendorId) {
      return res.status(403).json({ message: 'Product does not belong to vendor' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Calculate total and ETA
    const total = product.price * quantity;
    const eta = deliveryType === 'express' ? '1-2 hours' : '3-5 hours';

    // Create order
    const order = new Order({
      customerName,
      productsCount: 1, // For now, assuming 1 product per order
      total,
      status: 'Pending',
      eta,
      placedAt: new Date(),
      vendorId: req.vendorId,
      microhubId: microhubId,
      productId: productId,
      quantity,
      deliveryType,
      deliveryLocation: {
        coordinates: deliveryLocation.coordinates,
        address: deliveryLocation.address
      }
    });

    await order.save();

    // Update product stock
    await Product.findByIdAndUpdate(productId, { 
      $inc: { stock: -quantity } 
    });

    res.status(201).json({ data: order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

export default router;

