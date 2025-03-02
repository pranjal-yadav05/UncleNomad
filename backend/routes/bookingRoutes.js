import express from 'express';
import { verifyBooking, createBooking, getBookings, updateBooking, deleteBooking, checkAvailabiltiy, getUserBooking } from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Verify booking details
router.post('/verify',  authenticateToken, verifyBooking);

router.get('/check-availability', checkAvailabiltiy)

router.get('/user-bookings', authenticateToken, getUserBooking)

// Create new booking
router.post('/book', authenticateToken, createBooking);

// Get all bookings
router.get('/', authenticateToken, getBookings);

// Update booking status
router.put('/:id', authenticateToken, updateBooking);

// Delete booking
router.delete('/:id', authenticateToken, deleteBooking);


export default router;
