import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';
import Microhub from '../models/Microhub';
import Driver from '../models/Driver';

const router = Router();

// Generate random 4-digit alphanumeric OTP
const generateOTP = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate distance between two coordinates using Haversine formula
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let orders;
    
    if (req.role === 'admin') {
      // Admin can see all orders
      orders = await Order.find().sort({ createdAt: -1 }).populate('destinationMicrohubId', 'name location address latitude longitude');
    } else if (req.role === 'driver') {
      // Drivers can see waiting orders (available for pickup) and their assigned orders
      const driverId = req.driverId; // Driver ID from auth middleware
      orders = await Order.find({ 
        $or: [
          { status: 'Waiting' }, // Available orders
          { assignedDriverId: driverId } // Their assigned orders
        ]
      }).sort({ createdAt: -1 }).populate('destinationMicrohubId', 'name location address latitude longitude');
    } else if (req.vendorId) {
      // Vendor can see only their orders
      orders = await Order.find({ 
        vendorId: req.vendorId 
      }).sort({ createdAt: -1 }).populate('destinationMicrohubId', 'name location address latitude longitude');
    } else {
      return res.status(400).json({ message: 'Invalid request - missing role or vendor ID' });
    }
    
    res.json({ data: orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
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

    // Generate pickup and delivery OTPs
    const pickupOtp = generateOTP();
    const deliveryOtp = generateOTP();

    // Create order
    const orderData: any = {
      customerName,
      phoneNumber,
      productsCount: 1, // For now, assuming 1 product per order
      total,
      status: 'Waiting',
      eta,
      placedAt: new Date(),
      vendorId: req.vendorId,
      sourceMicrohubId,
      destinationMicrohubId,
      productId,
      quantity,
      deliveryType,
      specifiedAddress,
      pickupOtp,
      deliveryOtp,
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

// Accept order (driver)
router.post('/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can accept orders' });
    }

    const orderId = req.params.id;
    const driverId = req.driverId;

    const order = await Order.findById(orderId).populate('destinationMicrohubId', 'latitude longitude');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Waiting') {
      return res.status(400).json({ message: 'Order is not available for acceptance' });
    }

    // Calculate distance if not already calculated
    let distance = order.distance;
    if (!distance && order.destinationMicrohubId && order.deliveryLocation?.coordinates) {
      const microhub = order.destinationMicrohubId as any;
      if (microhub.latitude && microhub.longitude) {
        const [deliveryLng, deliveryLat] = order.deliveryLocation.coordinates;
        distance = haversineDistance(
          microhub.latitude,
          microhub.longitude,
          deliveryLat,
          deliveryLng
        );
      }
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Pickup',
        assignedDriverId: driverId,
        distance: distance || 0
      },
      { new: true }
    ).populate('destinationMicrohubId', 'name location address latitude longitude');

    res.json({ data: updatedOrder });
  } catch (error) {
    console.error('Order acceptance error:', error);
    res.status(500).json({ message: 'Failed to accept order' });
  }
});

// Verify pickup OTP
router.post('/:id/verify-pickup', async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can verify pickup' });
    }

    const { otp } = req.body;
    const orderId = req.params.id;
    const driverId = req.driverId;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.assignedDriverId?.toString() !== driverId) {
      return res.status(403).json({ message: 'Order not assigned to you' });
    }

    if (order.status !== 'Pickup') {
      return res.status(400).json({ message: 'Order is not in pickup state' });
    }

    if (order.pickupOtp !== otp.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update order to delivering state
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Delivering'
      },
      { new: true }
    ).populate('destinationMicrohubId', 'name location address latitude longitude');

    res.json({ data: updatedOrder });
  } catch (error) {
    console.error('Pickup verification error:', error);
    res.status(500).json({ message: 'Failed to verify pickup' });
  }
});

// Complete delivery
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can complete delivery' });
    }

    const { otp } = req.body;
    const orderId = req.params.id;
    const driverId = req.driverId;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.assignedDriverId?.toString() !== driverId) {
      return res.status(403).json({ message: 'Order not assigned to you' });
    }

    if (order.status !== 'Delivering') {
      return res.status(400).json({ message: 'Order is not in delivering state' });
    }

    // Check delivery OTP
    if (otp.toUpperCase() !== order.deliveryOtp) {
      return res.status(400).json({ message: 'Invalid delivery OTP' });
    }

    // Update order to completed state
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Completed'
      },
      { new: true }
    ).populate('destinationMicrohubId', 'name location address latitude longitude');

    // Update driver's delivery count
    await Driver.findByIdAndUpdate(driverId, {
      $inc: { deliveries: 1 }
    });

    res.json({ data: updatedOrder });
  } catch (error) {
    console.error('Delivery completion error:', error);
    res.status(500).json({ message: 'Failed to complete delivery' });
  }
});

export default router;

