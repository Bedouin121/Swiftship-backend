import dotenv from 'dotenv';

// Configure dotenv FIRST before any other imports that might use env variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { requireRole } from './middleware/auth';
import Order from './models/Order';

// Routes
import dashboardRoutes from './routes/dashboard';
import vendorRoutes from './routes/vendors';
import driverRoutes from './routes/drivers';
import microhubRoutes from './routes/microhubs';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import billingRoutes from './routes/billing';
import fleetRoutes from './routes/fleet';
import inventoryRoutes from './routes/inventory';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import shelfBookingRoutes from './routes/shelfBookings';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Swiftship API is running' });
});

// API Routes
const apiRouter = express.Router();

// Public auth routes (no role required)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/upload', uploadRoutes);

// Public customer routes (no auth required)
apiRouter.get('/orders/customer/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    console.log("🔍 Customer orders request for phone:", phoneNumber);
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find all orders for this phone number
    const orders = await Order.find({ 
      phoneNumber: phoneNumber 
    })
    .sort({ createdAt: -1 })
    .populate('productId', 'name')
    .populate('destinationMicrohubId', 'name location address');

    console.log("📊 Found orders count:", orders.length);
    console.log("📋 Orders found:", orders.map((o: any) => ({ id: o._id, phone: o.phoneNumber, customer: o.customerName })));

    // Transform orders to match the expected format
    const transformedOrders = orders.map((order: any) => ({
      _id: order._id,
      customerName: order.customerName,
      customerPhone: order.phoneNumber,
      items: [{
        name: order.productId ? order.productId.name : 'Unknown Product',
        quantity: order.quantity
      }],
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryLocation?.address || order.specifiedAddress,
      totalPrice: order.total,
      status: order.status.toLowerCase(),
      createdAt: order.placedAt || order.createdAt,
      deliveryOtp: order.deliveryOtp
    }));

    console.log("✅ Sending transformed orders:", transformedOrders.length);
    res.json({ data: transformedOrders });
  } catch (error) {
    console.error('❌ Failed to fetch customer orders:', error);
    res.status(500).json({ message: 'Failed to fetch customer orders' });
  }
});

// Debug endpoint
apiRouter.get('/orders/debug/phones', async (req, res) => {
  try {
    const phones = await Order.distinct('phoneNumber');
    console.log("📱 All phone numbers in database:", phones);
    
    // Also get some sample orders to see the format
    const sampleOrders = await Order.find({}).limit(3).select('phoneNumber customerName');
    console.log("📋 Sample orders:", sampleOrders);
    
    res.json({ 
      phones,
      sampleOrders: sampleOrders.map((o: any) => ({ phone: o.phoneNumber, customer: o.customerName }))
    });
  } catch (error) {
    console.error('Failed to fetch phone numbers:', error);
    res.status(500).json({ message: 'Failed to fetch phone numbers' });
  }
});

// Admin routes
apiRouter.use('/dashboard', requireRole(['admin']), dashboardRoutes);
apiRouter.use('/vendors', requireRole(['admin']), vendorRoutes);
apiRouter.use('/drivers', requireRole(['admin', 'driver']), driverRoutes);
apiRouter.use('/microhubs', requireRole(['admin', 'vendor']), microhubRoutes);
apiRouter.use('/fleet', requireRole(['admin']), fleetRoutes);
apiRouter.use('/billing', requireRole(['admin']), billingRoutes);
apiRouter.use('/inventory', requireRole(['admin']), inventoryRoutes);

// Vendor and Driver routes
apiRouter.use('/orders', requireRole(['vendor', 'admin', 'driver']), orderRoutes);
apiRouter.use('/products', requireRole(['vendor']), productRoutes);
apiRouter.use('/analytics', requireRole(['vendor']), analyticsRoutes);
apiRouter.use('/shelf-bookings', requireRole(['vendor']), shelfBookingRoutes);

app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

