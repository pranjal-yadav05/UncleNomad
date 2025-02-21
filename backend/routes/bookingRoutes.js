import express from 'express';
import { verifyBooking, createBooking, getBookings, updateBooking, deleteBooking, checkAvailabiltiy } from '../controllers/bookingController.js';

const router = express.Router();

// Verify booking details
router.post('/verify', verifyBooking);

router.get('/check-availability',checkAvailabiltiy)
// Create new booking
router.post('/book', createBooking);

// Get all bookings
router.get('/', getBookings);

// Update booking status
router.put('/:id', updateBooking);

// Delete booking
router.delete('/:id', deleteBooking);

export default router;
