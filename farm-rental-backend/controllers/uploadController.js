const { bucket } = require('../config/firebase');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

const uploadController = {
  // Upload multiple equipment images
  uploadEquipmentImages: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadPromises = req.files.map(async (file) => {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `equipment/${req.user.uid}/${timestamp}_${file.originalname}`;
        
        // Create file in bucket
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            metadata: {
              firebaseStorageDownloadTokens: require('uuid').v4()
            }
          }
        });

        return new Promise((resolve, reject) => {
          blobStream.on('error', (error) => {
            console.error('Upload error:', error);
            reject(error);
          });

          blobStream.on('finish', async () => {
            // Make file publicly accessible
            await blob.makePublic();
            
            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
            
            resolve(publicUrl);
          });

          blobStream.end(file.buffer);
        });
      });

      const imageUrls = await Promise.all(uploadPromises);

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        image_urls: imageUrls
      });

    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload images'
      });
    }
  },

  // Delete an image from storage
  deleteImage: async (req, res) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Image URL required' });
      }

      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = decodeURIComponent(urlParts.slice(-2).join('/'));

      // Delete file
      await bucket.file(filename).delete();

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image'
      });
    }
  }
};

module.exports = { upload, uploadController };
