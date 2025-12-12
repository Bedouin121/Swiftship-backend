import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vendor from '../models/Vendor';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json({ data: vendors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

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

