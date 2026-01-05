import dotenv from 'dotenv';

// Configure dotenv FIRST before any other imports that might use env variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { requireRole } from './middleware/auth';

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

