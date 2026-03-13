const express = require('express');
const router = express.Router();
const { upload, uploadController } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

// Upload equipment images (max 5 files)
router.post(
  '/equipment-images',
  authMiddleware,
  upload.array('images', 5),
  uploadController.uploadEquipmentImages
);

// Delete an image
router.delete('/image', authMiddleware, uploadController.deleteImage);

module.exports = router;
