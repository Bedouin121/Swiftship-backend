import ShelfBooking from '../models/ShelfBooking';
import Microhub from '../models/Microhub';

/**
 * Updates expired shelf bookings and releases their capacity
 */
export async function updateExpiredBookings() {
  try {
    const now = new Date();
    
    // Find all active bookings that have expired
    const expiredBookings = await ShelfBooking.find({
      status: 'active',
      endDate: { $lt: now }
    });

    console.log(`Found ${expiredBookings.length} expired bookings to process`);

    for (const booking of expiredBookings) {
      // Get the microhub to calculate utilization to release
      const microhub = await Microhub.findById(booking.microhubId);
      
      if (microhub) {
        const utilizationAmount = Math.ceil((microhub.capacity * booking.utilizationPercentage) / 100);
        
        // Release the utilization
        await Microhub.findByIdAndUpdate(booking.microhubId, {
          $inc: { utilized: -utilizationAmount }
        });
        
        console.log(`Released ${utilizationAmount} capacity from microhub ${microhub.name}`);
      }

      // Update booking status to expired
      booking.status = 'expired';
      await booking.save();
      
      console.log(`Updated booking ${booking._id} to expired status`);
    }

    return { processed: expiredBookings.length };
  } catch (error) {
    console.error('Error updating expired bookings:', error);
    throw error;
  }
}

/**
 * Get bookings that are expiring within the specified number of days
 */
export async function getExpiringSoonBookings(daysAhead: number = 7) {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const expiringSoon = await ShelfBooking.find({
      status: 'active',
      endDate: { $gte: now, $lte: futureDate }
    }).populate('vendorId', 'name email')
      .populate('microhubId', 'name location');

    return expiringSoon;
  } catch (error) {
    console.error('Error fetching expiring bookings:', error);
    throw error;
  }
}