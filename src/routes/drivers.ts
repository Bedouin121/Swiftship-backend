import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Driver from '../models/Driver';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json({ data: drivers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch drivers' });
  }
});

router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const pendingDrivers = await Driver.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ data: pendingDrivers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending drivers' });
  }
});

router.post('/approve/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findByIdAndUpdate(
      id, 
      { 
        status: 'active',
        joinedAt: new Date()
      }, 
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ data: driver });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve driver' });
  }
});

router.post('/reject/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findByIdAndUpdate(
      id, 
      { status: 'inactive' }, 
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ data: driver });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject driver' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const existingDriver = await Driver.findById(id);
    if (!existingDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const updateData: any = { status };
    if (status === 'active' && !existingDriver.joinedAt) {
      updateData.joinedAt = new Date();
    }

    const driver = await Driver.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ data: driver });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update driver status' });
  }
});

export default router;

