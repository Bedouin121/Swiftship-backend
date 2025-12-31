import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';
import Microhub from '../models/Microhub';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let orders;
    
    if (req.role === 'admin') {
      // Admin can see all orders
      orders = await Order.find().sort({ createdAt: -1 }).populate('destinationMicrohubId', 'name location address latitude longitude');
    } else if (req.vendorId) {
      // Vendor can see only their orders
      orders = await Order.find({ 
        vendorId: req.vendorId 
      }).sort({ createdAt: -1 }).populate('destinationMicrohubId', 'name location address latitude longitude');
    } else {
      return res.status(400).json({ message: 'Vendor ID is required for vendor requests' });
    }
    
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
      phoneNumber,
      sourceMicrohubId,
      destinationMicrohubId,
      specifiedAddress,
      productId, 
      quantity, 
      deliveryType, 
      deliveryLocation 
    } = req.body;

    if (!customerName || !phoneNumber || !sourceMicrohubId || !destinationMicrohubId || !specifiedAddress || !productId || !quantity || !deliveryType || !deliveryLocation) {
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
    const orderData: any = {
      customerName,
      phoneNumber,
      productsCount: 1, // For now, assuming 1 product per order
      total,
      status: 'Pending',
      eta,
      placedAt: new Date(),
      vendorId: req.vendorId,
      sourceMicrohubId,
      destinationMicrohubId,
      productId,
      quantity,
      deliveryType,
      specifiedAddress,
      deliveryLocation: {
        coordinates: deliveryLocation.coordinates,
        address: deliveryLocation.address
      }
    };

    // Add address details if provided
    if (deliveryLocation.addressDetails) {
      orderData.deliveryLocation.addressDetails = deliveryLocation.addressDetails;
    }

    const order = new Order(orderData);

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

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to vendor
    if (order.vendorId.toString() !== req.vendorId) {
      return res.status(403).json({ message: 'Order does not belong to vendor' });
    }

    // Restore product stock
    await Product.findByIdAndUpdate(order.productId, { 
      $inc: { stock: order.quantity } 
    });

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

export default router;

