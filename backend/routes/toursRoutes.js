import express from 'express';
import multer from 'multer';
import {
  getTours,
  createTour,
  getTourById,
  updateTour,
  deleteTour,
  verifyTourBooking,
  createTourBooking,
  initiatePayment,
  verifyTourPayment,
  confirmTourBooking,
  getTourBookingById,
  deleteTourImage,
  getAllTourBookings,
  deleteTourBooking
} from '../controllers/tourController.js';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Stores images in memory
const upload = multer({ storage: storage });

// Middleware for validating tour data
const validateTourData = (req, res, next) => {
  const { title, description, price, duration, groupSize, location, startDate, endDate } = req.body;
  if (!title || !description || !price || !duration || !groupSize || !location || !startDate || !endDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  next();
};

// Middleware for validating itinerary data
const validateItinerary = (req, res, next) => {
  if (req.body.itinerary && Array.isArray(req.body.itinerary)) {
    for (const day of req.body.itinerary) {
      if (!day.day || !day.title || !day.description || !day.activities || !day.accommodation) {
        return res.status(400).json({ message: 'All itinerary fields are required for each day' });
      }
    }
  }
  next();
};

// Booking routes
router.get('/bookings', getAllTourBookings); 
router.post('/:id/verify-booking', verifyTourBooking);
router.post('/:id/book', createTourBooking);
router.get('/booking/:id', getTourBookingById);
router.put('/:tourId/book/:bookingId/confirm', confirmTourBooking);
router.delete('/:tourId/image/:imageIndex', deleteTourImage);
router.delete('/booking/:id', deleteTourBooking);


// CRUD routes
router.get('/', getTours);
router.post('/', upload.array('images', 5), validateItinerary, validateTourData, createTour);
router.get('/:id', getTourById);
router.put('/:id', upload.array('images', 5), validateItinerary, validateTourData, updateTour);
router.delete('/:id', deleteTour);



// Payment routes
router.post('/:id/initiate-payment', initiatePayment);
router.post('/:id/verify-payment', verifyTourPayment);

export default router;
