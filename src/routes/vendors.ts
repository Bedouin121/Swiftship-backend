import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import Vendor from '../models/Vendor';
import PendingVendor from '../models/PendingVendor';

const router = Router();

// Get all vendors (admin only)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json({ data: vendors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Get all pending vendors (admin only)
router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const pendingVendors = await PendingVendor.find().sort({ createdAt: -1 });
    res.json({ data: pendingVendors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending vendors' });
  }
});

// Get vendor details by ID (admin only)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor details' });
  }
});

// Get pending vendor details by ID (admin only)
router.get('/pending/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pendingVendor = await PendingVendor.findById(id);
    
    if (!pendingVendor) {
      return res.status(404).json({ message: 'Pending vendor not found' });
    }

    res.json({ data: pendingVendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending vendor details' });
  }
});

// Approve pending vendor (admin only)
router.post('/approve/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find pending vendor
    const pendingVendor = await PendingVendor.findById(id);
    if (!pendingVendor) {
      return res.status(404).json({ message: 'Pending vendor not found' });
    }

    // Create approved vendor
    const vendor = new Vendor({
      firstName: pendingVendor.firstName,
      lastName: pendingVendor.lastName,
      name: `${pendingVendor.firstName} ${pendingVendor.lastName}`,
      email: pendingVendor.email,
      phone: pendingVendor.phone,
      password: pendingVendor.password,
      address: pendingVendor.address,
      city: pendingVendor.city,
      companyName: pendingVendor.companyName,
      businessType: pendingVendor.businessType,
      registrationNumber: pendingVendor.registrationNumber,
      taxId: pendingVendor.taxId,
      website: pendingVendor.website,
      nidImageUrl: pendingVendor.nidImageUrl,
      tradeLicenseUrl: pendingVendor.tradeLicenseUrl,
      status: 'approved',
      registeredAt: new Date()
    });

    await vendor.save();
    
    // Remove from pending vendors
    await PendingVendor.findByIdAndDelete(id);

    res.json({ 
      message: 'Vendor approved successfully',
      data: vendor 
    });
  } catch (error) {
    console.error('Vendor approval error:', error);
    res.status(500).json({ message: 'Failed to approve vendor' });
  }
});

// Reject pending vendor (admin only)
router.post('/reject/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Remove from pending vendors
    const deletedVendor = await PendingVendor.findByIdAndDelete(id);
    
    if (!deletedVendor) {
      return res.status(404).json({ message: 'Pending vendor not found' });
    }

    res.json({ 
      message: 'Vendor application rejected and removed',
      data: { id: deletedVendor._id, email: deletedVendor.email }
    });
  } catch (error) {
    console.error('Vendor rejection error:', error);
    res.status(500).json({ message: 'Failed to reject vendor' });
  }
});

// Update vendor status (admin only)
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ data: vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vendor status' });
  }
});

export default router;

