import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Microhub from '../models/Microhub';

dotenv.config();

async function checkMicrohubs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftship');
    console.log('Connected to MongoDB');

    // Count microhubs
    const count = await Microhub.countDocuments();
    console.log(`Total microhubs in database: ${count}`);

    // Get all microhubs
    const microhubs = await Microhub.find();
    console.log('Microhubs:');
    microhubs.forEach(hub => {
      console.log(`- ${hub.name} (${hub.location}) - Status: ${hub.status}, Capacity: ${hub.capacity}, Utilized: ${hub.utilized}`);
    });

    if (count === 0) {
      console.log('\n❌ No microhubs found! You need to run the seed script:');
      console.log('cd Swiftship-backend && npm run seed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMicrohubs();