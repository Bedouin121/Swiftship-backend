import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Microhub from '../models/Microhub';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const microhubs = await Microhub.find().sort({ createdAt: -1 });
    res.json({ data: microhubs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch microhubs' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, address, thana, district, latitude, longitude, capacity, utilized } = req.body;

    if (!name || !location || capacity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const microhubData: any = {
      name,
      location,
      capacity,
      utilized: utilized || 0,
      status: 'active',
    };

    // Add address details if provided
    if (address) microhubData.address = address;
    if (thana) microhubData.thana = thana;
    if (district) microhubData.district = district;

    // Add coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      microhubData.latitude = latitude;
      microhubData.longitude = longitude;
    }

    const microhub = new Microhub(microhubData);

    await microhub.save();
    res.status(201).json({ data: microhub });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create microhub' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, address, thana, district, latitude, longitude, capacity, status } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (thana !== undefined) updateData.thana = thana;
    if (district !== undefined) updateData.district = district;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (status) updateData.status = status;

    const microhub = await Microhub.findByIdAndUpdate(id, updateData, { new: true });

    if (!microhub) {
      return res.status(404).json({ message: 'Microhub not found' });
    }

    res.json({ data: microhub });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update microhub' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const microhub = await Microhub.findByIdAndDelete(id);

    if (!microhub) {
      return res.status(404).json({ message: 'Microhub not found' });
    }

    res.json({ message: 'Microhub deleted successfully', data: microhub });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete microhub' });
  }
});

export default router;

