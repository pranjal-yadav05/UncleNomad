import express from 'express'
import {getAllReviews, getReviewById, createReview, updateReview, deleteReview} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllReviews);

// Get a specific review by ID - accessible with API key only
router.get('/:id', getReviewById);

// Protected routes - require authentication and API key
router.post('/', 
  authenticateToken, 
  createReview
);

router.put('/:id', 
  authenticateToken, 
  updateReview
);

router.delete('/:id', 
  authenticateToken, 
  deleteReview
);

export default router