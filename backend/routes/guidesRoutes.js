import express from 'express';
const router = express.Router();
import {
  createGuide,
  getGuides,
  getGuideById,
  updateGuide,
  deleteGuide
} from '../controllers/guideController.js';

// Create a new guide
router.post('/', createGuide);

// Get all guides
router.get('/', getGuides);

// Get a single guide by ID
router.get('/:id', getGuideById);

// Update a guide
router.put('/:id', updateGuide);

// Delete a guide
router.delete('/:id', deleteGuide);

export default router;
