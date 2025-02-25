import express from 'express';
const router = express.Router();
import { uploadMedia, deleteMedia } from '../controllers/uploadController.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp');  // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload media route - matches frontend API endpoint
router.post('/', upload.single('file'), uploadMedia);

// Delete media route - matches frontend call in handleDeleteMedia
router.delete('/', deleteMedia);

export default router;