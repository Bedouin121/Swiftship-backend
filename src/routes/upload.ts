import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';

const router = Router();

// Debug endpoint to check environment variables
router.get('/debug', (req: Request, res: Response) => {
  res.json({
    cloudinary_config: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    },
    all_env: Object.keys(process.env).filter(key => key.startsWith('CLOUDINARY'))
  });
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload single image
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('📸 Image upload request received');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('📁 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convert buffer to base64 data URI
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    console.log('🔄 Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'swiftship/vendor-documents',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Upload successful:', result.public_id);

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('💥 Image upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload multiple images (for NID and Trade License)
router.post('/documents', upload.fields([
  { name: 'nidImage', maxCount: 1 },
  { name: 'tradeLicense', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.nidImage || !files.tradeLicense) {
      return res.status(400).json({ 
        message: 'Both NID image and Trade License are required' 
      });
    }

    const uploadPromises = [];

    // Upload NID image
    const nidDataUri = `data:${files.nidImage[0].mimetype};base64,${files.nidImage[0].buffer.toString('base64')}`;
    uploadPromises.push(
      cloudinary.uploader.upload(nidDataUri, {
        folder: 'swiftship/vendor-documents/nid',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      })
    );

    // Upload Trade License
    const licenseDataUri = `data:${files.tradeLicense[0].mimetype};base64,${files.tradeLicense[0].buffer.toString('base64')}`;
    uploadPromises.push(
      cloudinary.uploader.upload(licenseDataUri, {
        folder: 'swiftship/vendor-documents/trade-license',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      })
    );

    const [nidResult, licenseResult] = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: {
        nidImage: {
          url: nidResult.secure_url,
          public_id: nidResult.public_id
        },
        tradeLicense: {
          url: licenseResult.secure_url,
          public_id: licenseResult.public_id
        }
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload documents' 
    });
  }
});

export default router;