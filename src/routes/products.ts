import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const products = await Product.find({ 
      vendorId: req.vendorId 
    }).sort({ createdAt: -1 });
    
    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { name, sku, category, price, stock, description } = req.body;

    if (!name || !sku || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = new Product({
      name,
      sku,
      category,
      price,
      stock,
      description,
      vendorId: req.vendorId,
    });

    await product.save();
    
    // Update vendor product count
    const Vendor = (await import('../models/Vendor')).default;
    await Vendor.findByIdAndUpdate(req.vendorId, { $inc: { products: 1 } });

    res.status(201).json({ data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { id } = req.params;
    const { name, sku, category, price, stock, description } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, vendorId: req.vendorId },
      { name, sku, category, price, stock, description },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    const { id } = req.params;

    const product = await Product.findOneAndDelete({ 
      _id: id, 
      vendorId: req.vendorId 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update vendor product count
    const Vendor = (await import('../models/Vendor')).default;
    await Vendor.findByIdAndUpdate(req.vendorId, { $inc: { products: -1 } });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;

