import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Vendor from '../models/Vendor';
import PendingVendor from '../models/PendingVendor';
import Driver from '../models/Driver';

const router = Router();

// Vendor registration
router.post('/register/vendor', async (req: Request, res: Response) => {
  console.log('🔥 Vendor registration request received');
  console.log('Request body:', req.body);
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      city,
      companyName,
      businessType,
      registrationNumber,
      taxId,
      website,
      businessDescription,
      nidNumber
    } = req.body;

    console.log('📝 Extracted fields:', {
      firstName, lastName, email, phone, address, city,
      companyName, businessType, registrationNumber, taxId,
      website, businessDescription, nidNumber
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !address || !city || 
        !companyName || !businessType || !registrationNumber || !taxId || !businessDescription || !nidNumber) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate NID number (exactly 10 digits)
    if (!/^\d{10}$/.test(nidNumber)) {
      console.log('❌ Invalid NID number format');
      return res.status(400).json({ message: 'NID Number must be exactly 10 digits' });
    }

    // Check if email already exists in PendingVendor or Vendor
    console.log('🔍 Checking for existing email...');
    const existingPendingVendor = await PendingVendor.findOne({ email });
    const existingVendor = await Vendor.findOne({ email });
    
    if (existingPendingVendor || existingVendor) {
      console.log('❌ Email already exists');
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create pending vendor
    console.log('💾 Creating pending vendor...');
    const pendingVendor = new PendingVendor({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      companyName,
      businessType,
      registrationNumber,
      taxId,
      website: website || undefined,
      businessDescription,
      nidNumber
    });

    await pendingVendor.save();
    console.log('✅ Pending vendor created successfully:', pendingVendor._id);

    res.status(201).json({ 
      message: 'Vendor registration submitted successfully. Your application is pending approval.',
      data: {
        id: pendingVendor._id,
        email: pendingVendor.email,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('💥 Vendor registration error:', error);
    res.status(500).json({ message: 'Failed to register vendor' });
  }
});

// Driver registration
router.post('/register/driver', async (req: Request, res: Response) => {
  console.log('🔥 Driver registration request received');
  console.log('Request body:', req.body);
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      city,
      nidNumber,
      drivingLicense,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleYear,
      emergencyContact,
      emergencyPhone
    } = req.body;

    console.log('📝 Extracted fields:', {
      firstName, lastName, email, phone, address, city,
      nidNumber, drivingLicense, vehicleType, vehicleNumber,
      emergencyContact, emergencyPhone
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !address || !city || 
        !nidNumber || !drivingLicense || !vehicleType || !vehicleNumber || 
        !emergencyContact || !emergencyPhone) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if email already exists
    console.log('🔍 Checking for existing email...');
    const existingDriver = await Driver.findOne({ email });
    
    if (existingDriver) {
      console.log('❌ Email already exists');
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create pending driver
    console.log('💾 Creating pending driver...');
    const driver = new Driver({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      nidNumber,
      licenseNumber: drivingLicense,
      vehicleType,
      vehiclePlateNumber: vehicleNumber,
      vehicleModel: vehicleModel || undefined,
      vehicleYear: vehicleYear || undefined,
      emergencyContact,
      emergencyPhone,
      status: 'pending'
    });

    await driver.save();
    console.log('✅ Pending driver created successfully:', driver._id);

    res.status(201).json({ 
      message: 'Driver registration submitted successfully. Your application is pending approval.',
      data: {
        id: driver._id,
        email: driver.email,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('💥 Driver registration error:', error);
    res.status(500).json({ message: 'Failed to register driver' });
  }
});

// Vendor and Driver login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // For vendor login, check approved vendors only
    if (userType === 'vendor') {
      const vendor = await Vendor.findOne({ email, status: 'approved' });
      
      if (!vendor) {
        return res.status(401).json({ message: 'Invalid credentials or account not approved' });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, vendor.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { 
          vendorId: vendor._id, 
          email: vendor.email, 
          role: 'vendor' 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        data: {
          token,
          user: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            role: 'vendor'
          }
        }
      });
    } else if (userType === 'driver') {
      // For driver login, check active drivers only
      const driver = await Driver.findOne({ email, status: 'active' });
      
      if (!driver) {
        return res.status(401).json({ message: 'Invalid credentials or account not approved' });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, driver.password!);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { 
          driverId: driver._id, 
          email: driver.email, 
          role: 'driver' 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        data: {
          token,
          user: {
            id: driver._id,
            name: driver.name,
            email: driver.email,
            role: 'driver'
          }
        }
      });
    } else {
      // Handle admin login or other user types
      res.status(400).json({ message: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;