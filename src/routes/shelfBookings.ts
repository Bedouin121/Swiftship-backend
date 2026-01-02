import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import ShelfBooking from '../models/ShelfBooking';
import Microhub from '../models/Microhub';
import { updateExpiredBookings } from '../utils/shelfBookingUtils';

const router = Router();

// Get all shelf bookings for the authenticated vendor
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const bookings = await ShelfBooking.find({ 
      vendorId: req.vendorId 
    })
    .populate('microhubId', 'name location address')
    .sort({ createdAt: -1 });
    
    res.json({ data: bookings });
  } catch (error) {
    console.error('Error fetching shelf bookings:', error);
    res.status(500).json({ message: 'Failed to fetch shelf bookings' });
  }
});

// Create a new shelf booking
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { microhubId, shelfSize, startDate, endDate } = req.body;

    if (!microhubId || !shelfSize || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate shelf size and get utilization percentage
    const utilizationMap = {
      'small': 10,
      'medium': 25,
      'large': 50
    };

    if (!utilizationMap[shelfSize as keyof typeof utilizationMap]) {
      return res.status(400).json({ message: 'Invalid shelf size' });
    }

    const utilizationPercentage = utilizationMap[shelfSize as keyof typeof utilizationMap];

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check if microhub exists and has enough capacity
    const microhub = await Microhub.findById(microhubId);
    if (!microhub) {
      return res.status(404).json({ message: 'Microhub not found' });
    }

    if (microhub.status !== 'active') {
      return res.status(400).json({ message: 'Microhub is not active' });
    }

    // Calculate the actual utilization amount
    const utilizationAmount = Math.ceil((microhub.capacity * utilizationPercentage) / 100);

    // Check if there's enough capacity
    if (microhub.utilized + utilizationAmount > microhub.capacity) {
      return res.status(400).json({ 
        message: 'Insufficient capacity in the selected microhub',
        available: microhub.capacity - microhub.utilized,
        required: utilizationAmount
      });
    }

    // Create the shelf booking
    const booking = new ShelfBooking({
      vendorId: req.vendorId,
      microhubId,
      shelfSize,
      utilizationPercentage,
      startDate: start,
      endDate: end,
      status: 'active'
    });

    await booking.save();

    // Update microhub utilization
    await Microhub.findByIdAndUpdate(microhubId, {
      $inc: { utilized: utilizationAmount }
    });

    // Populate the response
    await booking.populate('microhubId', 'name location address');

    res.status(201).json({ data: booking });
  } catch (error) {
    console.error('Error creating shelf booking:', error);
    res.status(500).json({ message: 'Failed to create shelf booking' });
  }
});

// Cancel a shelf booking
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { id } = req.params;

    const booking = await ShelfBooking.findOne({
      _id: id,
      vendorId: req.vendorId
    });

    if (!booking) {
      return res.status(404).json({ message: 'Shelf booking not found' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ message: 'Cannot cancel non-active booking' });
    }

    // Get microhub to calculate utilization to release
    const microhub = await Microhub.findById(booking.microhubId);
    if (microhub) {
      const utilizationAmount = Math.ceil((microhub.capacity * booking.utilizationPercentage) / 100);
      
      // Release the utilization
      await Microhub.findByIdAndUpdate(booking.microhubId, {
        $inc: { utilized: -utilizationAmount }
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Shelf booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling shelf booking:', error);
    res.status(500).json({ message: 'Failed to cancel shelf booking' });
  }
});

// Get booking statistics for the vendor
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [activeBookings, totalLocations, expiringSoon] = await Promise.all([
      ShelfBooking.countDocuments({ vendorId: req.vendorId, status: 'active' }),
      ShelfBooking.distinct('microhubId', { vendorId: req.vendorId, status: 'active' }).then(ids => ids.length),
      ShelfBooking.countDocuments({ 
        vendorId: req.vendorId, 
        status: 'active',
        endDate: { $lte: oneWeekFromNow, $gte: now }
      })
    ]);

    res.json({
      data: {
        activeBookings,
        totalLocations,
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ message: 'Failed to fetch booking statistics' });
  }
});

// Admin route to update expired bookings (can be called manually or via cron)
router.post('/update-expired', async (req: AuthRequest, res: Response) => {
  try {
    // This could be restricted to admin role only if needed
    const result = await updateExpiredBookings();
    res.json({ 
      message: 'Expired bookings updated successfully',
      processed: result.processed
    });
  } catch (error) {
    console.error('Error updating expired bookings:', error);
    res.status(500).json({ message: 'Failed to update expired bookings' });
  }
});

export default router;