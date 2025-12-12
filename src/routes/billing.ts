import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Invoice from '../models/Invoice';

const router = Router();

router.get('/invoices', async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await Invoice.find()
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ data: invoices });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

router.patch('/invoices/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['paid', 'pending', 'overdue'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('vendor', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

export default router;

