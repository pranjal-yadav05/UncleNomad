import express from 'express';
import { 
  submitRoomReview, 
  submitTourReview, 
  getRoomReviews, 
  getTourReviews, 
  getUserReviews,
  deleteReview,
  updateReviewStatus,
  adminDeleteReview,
  getAllUserReviews
} from '../controllers/userReviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes requiring authentication
router.use(authenticateToken);

router.get('/',getAllUserReviews)
// Submit reviews
router.post('/room', submitRoomReview);
router.post('/tour', submitTourReview);

// Get reviews
router.get('/room/:roomId', getRoomReviews);
router.get('/tour/:tourId', getTourReviews);
router.get('/user', getUserReviews);
router.patch('/:reviewId/status',updateReviewStatus)

// Delete review
router.delete('/:reviewId', adminDeleteReview);

export default router;