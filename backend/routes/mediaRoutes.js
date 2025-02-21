import express from 'express';
const router = express.Router();
import {
  createMedia,
  getMedia,
  updateMediaOrder,
  deleteMedia
} from '../controllers/mediaController.js';

// Create new media
router.post('/', createMedia);

// Get all media
router.get('/', getMedia);

// Update media order
router.put('/order', updateMediaOrder);

// Delete media
router.delete('/:id', deleteMedia);

export default router;
