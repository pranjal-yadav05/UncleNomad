import express from 'express';
const router = express.Router();

import {
  createTour,
  getTours,
  getTourById,
  updateTour,
  deleteTour
} from '../controllers/tourController.js';

// Middleware for validating tour data
const validateTourData = (req, res, next) => {
  const { title, description, price, duration, groupSize, location } = req.body;
  if (!title || !description || !price || !duration || !groupSize || !location) {
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


// Create a new tour
router.post('/', validateTourData, validateItinerary, createTour);


// Get all tours
router.get('/', getTours);

// Get a single tour by ID
router.get('/:id', getTourById);

// Update a tour
router.put('/:id', validateTourData, validateItinerary, updateTour);


// Delete a tour
router.delete('/:id', deleteTour);

export default router;
