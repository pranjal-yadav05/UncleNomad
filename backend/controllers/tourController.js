import Tour from '../models/Tour.js';

// Create a new tour
const createTour = async (req, res) => {
  try {
    const { id, title, description, price, duration, groupSize, location, itinerary } = req.body;

    // Validate required fields
    if (!id || !title || !description || !price || !duration || !groupSize || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate itinerary if provided
    if (itinerary && Array.isArray(itinerary)) {
      for (const day of itinerary) {
        if (!day.day || !day.title || !day.description || !day.activities || !day.accommodation) {
          return res.status(400).json({ message: 'All itinerary fields are required for each day' });
        }
      }
    }

    const newTour = await Tour.create({
      id,
      title,
      description,
      price,
      duration,
      groupSize,
      location,
      itinerary: itinerary || []
    });

    res.status(201).json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all tours
const getTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single tour by ID
const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json(tour);
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a tour
const updateTour = async (req, res) => {
  try {
    const { id, title, description, price, duration, groupSize, location, itinerary } = req.body;

    // Validate required fields
    if (!id || !title || !description || !price || !duration || !groupSize || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate itinerary if provided
    if (itinerary && Array.isArray(itinerary)) {
      for (const day of itinerary) {
        if (!day.day || !day.title || !day.description || !day.activities || !day.accommodation) {
          return res.status(400).json({ message: 'All itinerary fields are required for each day' });
        }
      }
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      {
        id,
        title,
        description,
        price,
        duration,
        groupSize,
        location,
        itinerary: itinerary || []
      },
      { new: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json(updatedTour);
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a tour
const deleteTour = async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    if (!deletedTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  createTour,
  getTours,
  getTourById,
  updateTour,
  deleteTour
};
