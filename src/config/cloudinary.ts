import { v2 as cloudinary } from 'cloudinary';

console.log('🔧 Cloudinary Environment Variables:');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);

// Use CLOUDINARY_URL if available, otherwise individual config
if (process.env.CLOUDINARY_URL) {
  // Cloudinary will automatically parse the URL
  console.log('🔧 Using CLOUDINARY_URL for configuration');
} else {
  // Fallback to individual config
  cloudinary.config({
    cloud_name: 'dakz7nav0',
    api_key: '217545968876985',
    api_secret: 'Pfpl7jxCqYGEPMKGK2vh4SundA4',
    secure: true,
  });
  console.log('🔧 Using individual config values');
}

console.log('🔧 Cloudinary configured with:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? 'Set' : 'Not set',
  api_secret: cloudinary.config().api_secret ? 'Set' : 'Not set'
});

export default cloudinary;