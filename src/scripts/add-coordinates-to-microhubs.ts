import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Microhub from '../models/Microhub';

dotenv.config();

// Sample coordinates for common Dhaka locations (you can update these)
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  'Dhanmondi': { lat: 23.7461, lng: 90.3742 },
  'Gulshan': { lat: 23.7925, lng: 90.4078 },
  'Uttara': { lat: 23.8759, lng: 90.3795 },
  'Mirpur': { lat: 23.8223, lng: 90.3654 },
  'Wari': { lat: 23.7104, lng: 90.4074 },
  'Old Dhaka': { lat: 23.7104, lng: 90.4074 },
  'Motijheel': { lat: 23.7337, lng: 90.4168 },
  'Banani': { lat: 23.7937, lng: 90.4066 },
  'Bashundhara': { lat: 23.8103, lng: 90.4125 },
  'Tejgaon': { lat: 23.7639, lng: 90.3889 },
};

async function addCoordinatesToMicrohubs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftship');
    console.log('Connected to MongoDB');

    // Find all microhubs without coordinates
    const microhubsWithoutCoords = await Microhub.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null }
      ]
    });

    console.log(`Found ${microhubsWithoutCoords.length} microhubs without coordinates`);

    for (const hub of microhubsWithoutCoords) {
      console.log(`Processing: ${hub.name} - ${hub.location}`);
      
      // Try to match location with predefined coordinates
      let coords = null;
      for (const [area, coordinates] of Object.entries(locationCoordinates)) {
        if (hub.location.toLowerCase().includes(area.toLowerCase())) {
          coords = coordinates;
          break;
        }
      }

      if (coords) {
        await Microhub.findByIdAndUpdate(hub._id, {
          latitude: coords.lat,
          longitude: coords.lng
        });
        console.log(`✓ Updated ${hub.name} with coordinates: ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`⚠ No coordinates found for ${hub.name} - ${hub.location}`);
        console.log('  You can manually update this through the admin interface');
      }
    }

    console.log('\nMigration completed!');
    console.log('You can now see microhubs on the stock tracking map.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  addCoordinatesToMicrohubs();
}

export default addCoordinatesToMicrohubs;