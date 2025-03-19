import express from 'express';
import { 
  submitRoomReview, 
  submitTourReview, 
  getRoomReviews, 
  getTourReviews, 
  getUserReviews,
  deleteReview 
} from '../controllers/userReviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes requiring authentication
router.use(authenticateToken);

// Submit reviews
router.post('/room', submitRoomReview);
router.post('/tour', submitTourReview);

// Get reviews
router.get('/room/:roomId', getRoomReviews);
router.get('/tour/:tourId', getTourReviews);
router.get('/user', getUserReviews);

// Delete review
router.delete('/:reviewId', deleteReview);

export default router;