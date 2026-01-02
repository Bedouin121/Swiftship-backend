import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Driver from '../models/Driver';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

const addTestDriver = async () => {
  try {
    await connectDB();
    
    // Add first test driver
    const testDriver1 = new Driver({
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+8801234567890',
      address: '123 Main Street',
      city: 'Dhaka',
      licenseNumber: 'DL123456789',
      vehicleType: 'Motorcycle',
      vehicleModel: 'Honda CB150R',
      vehicleYear: '2022',
      vehiclePlateNumber: 'DHA-1234',
      nidNumber: '1234567890123',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+8801987654321',
      status: 'pending'
    });

    // Add second test driver
    const testDriver2 = new Driver({
      name: 'Ahmed Rahman',
      firstName: 'Ahmed',
      lastName: 'Rahman',
      email: 'ahmed.rahman@example.com',
      phone: '+8801987654321',
      address: '456 Park Avenue',
      city: 'Chittagong',
      licenseNumber: 'DL987654321',
      vehicleType: 'Car',
      vehicleModel: 'Toyota Corolla',
      vehicleYear: '2021',
      vehiclePlateNumber: 'CTG-5678',
      nidNumber: '9876543210987',
      emergencyContact: 'Fatima Rahman',
      emergencyPhone: '+8801234567890',
      status: 'pending'
    });

    // Check if drivers already exist to avoid duplicates
    const existingDriver1 = await Driver.findOne({ email: 'john.doe@example.com' });
    const existingDriver2 = await Driver.findOne({ email: 'ahmed.rahman@example.com' });

    if (!existingDriver1) {
      await testDriver1.save();
      console.log('✅ Test driver 1 added successfully:', testDriver1.name);
    } else {
      console.log('ℹ️ Test driver 1 already exists');
    }

    if (!existingDriver2) {
      await testDriver2.save();
      console.log('✅ Test driver 2 added successfully:', testDriver2.name);
    } else {
      console.log('ℹ️ Test driver 2 already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test driver:', error);
    process.exit(1);
  }
};

addTestDriver();