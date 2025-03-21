import Review from '../models/UserReview.js';
import Booking from '../models/Booking.js';
import TourBooking from '../models/TourBooking.js';
import Tour from '../models/Tour.js';
import Room from '../models/Room.js';
import mongoose from 'mongoose';

// Submit a review for a room booking
export const submitRoomReview = async (req, res) => {
  const { bookingId, roomId, rating, review: comment } = req.body;

  if (!bookingId || !roomId || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const userId = req.user.id;
  const userName = req.user.name || "Anonymous";

  try {
    // Verify the booking exists and belongs to the user
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      email: req.user.email 
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or you are not authorized to review it" });
    }

    // Ensure the roomId is actually in the user's booking
    const roomInBooking = booking.rooms.find(room => room.roomId.toString() === roomId);
    if (!roomInBooking) {
      return res.status(400).json({ message: "Invalid room ID. This room was not booked by you." });
    }

    // Check if checkout date is in the past
    if (new Date(booking.checkOut) > new Date()) {
      return res.status(400).json({ message: "You can only review after your stay is completed" });
    }

    // Check if the user has already reviewed this specific room type in this booking
    const existingReview = await Review.findOne({ 
      bookingId, 
      itemId: roomId,  
      userId,  
      bookingType: "room"
    });
    
    console.log("Existing Review Found:", existingReview); // Debugging
    
    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review for this room type in this booking." });
    }
    

    // Create the review
    const newReview = new Review({
      userId,
      userName,
      bookingId,
      bookingType: "room",
      itemId: roomId,
      rating: parseInt(rating, 10),
      comment: comment || "",
    });

    // Save the review
    await newReview.save();

    // Update the room's average rating
    await updateRoomRating(roomId);

    return res.status(201).json({
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.bookingId) {
      return res.status(400).json({ 
        message: "You have already submitted a review for this booking.",
        error: "duplicate_review" 
      });
    }
    
    console.error("Error submitting room review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Submit a review for a tour booking
export const submitTourReview = async (req, res) => {
  const { bookingId, rating, review: comment } = req.body;
  const userId = req.user.id; // Assuming you have user data in req.user from auth middleware
  const userName = req.user.name || 'Anonymous';
  
  try {
    // Verify the booking exists and belongs to the user
    const booking = await TourBooking.findOne({ 
      _id: bookingId,
      email: req.user.email // Match by email to ensure user owns this booking
    });

    if (!booking) {
      return res.status(404).json({ message: 'Tour booking not found or you are not authorized to review it' });
    }

    // Check if tour date is in the past
    const tourDate = new Date(booking.bookingDate);
    const currentDate = new Date();
    
    if (tourDate > currentDate) {
      return res.status(400).json({ message: 'You can only review after your tour is completed' });
    }

    // Check if a review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already submitted a review for this booking' });
    }

    // Get the tour ID
    const itemId = booking.tour;

    // Create the review
    const newReview = new Review({
      userId,
      userName,
      bookingId,
      bookingType: 'tour',
      itemId,
      rating: parseInt(rating),
      comment: comment || '',
    });

    // Save the review
    await newReview.save();

    // Update average rating on the tour (optional)
    await updateTourRating(itemId);

    return res.status(201).json({ 
      message: 'Tour review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error submitting tour review:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update room average rating
async function updateRoomRating(roomId) {
  try {
    const reviews = await Review.find({ 
      itemId: roomId,
      bookingType: 'room',
      status: 'approved'
    });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await Room.findByIdAndUpdate(roomId, { 
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length
      });
    }
  } catch (error) {
    console.error('Error updating room rating:', error);
  }
}

// Helper function to update tour average rating
async function updateTourRating(tourId) {
  try {
    const reviews = await Review.find({ 
      itemId: tourId,
      bookingType: 'tour',
      status: 'approved'
    });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await Tour.findByIdAndUpdate(tourId, { 
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length
      });
    }
  } catch (error) {
    console.error('Error updating tour rating:', error);
  }
}

// Get reviews for a specific room
export const getRoomReviews = async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const reviews = await Review.find({ 
      itemId: roomId,
      bookingType: 'room',
      status: 'approved'
    }).sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching room reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reviews for a specific tour
export const getTourReviews = async (req, res) => {
  const { tourId } = req.params;
  
  try {
    const reviews = await Review.find({ 
      itemId: tourId,
      bookingType: 'tour',
      status: 'approved'
    }).sort({ createdAt: -1 });
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching tour reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a user's reviews
export const getUserReviews = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a review (user can delete their own review)
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;
  
  try {
    const review = await Review.findOne({ _id: reviewId, userId });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or you are not authorized to delete it' });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    // Update average rating for the item
    if (review.bookingType === 'room') {
      await updateRoomRating(review.itemId);
    } else {
      await updateTourRating(review.itemId);
    }
    
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};