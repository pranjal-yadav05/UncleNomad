import Review from "../models/UserReview.js";
import Booking from "../models/Booking.js";
import TourBooking from "../models/TourBooking.js";
import Tour from "../models/Tour.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Submit a review for a room booking
export const submitRoomReview = async (req, res) => {
  const { bookingId, roomId, rating, review: comment } = req.body;

  if (!bookingId || !roomId || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const userId = req.user.id;
  const userName = req.user.name || "Anonymous";

  try {
    console.log("Submitting room review for booking ID:", bookingId);
    console.log("User data from token:", req.user);

    // Build a query to find the booking based on available user info
    const query = { _id: bookingId };

    // Add user identifiers to the query using phone matching logic
    if (req.user.phone) {
      // Process phone number to handle different formats
      const phoneDigits = req.user.phone.replace(/\D/g, "");
      // Match the last digits of the phone number to handle different country code formats
      const lastDigits = phoneDigits.slice(-10);
      query.phone = { $regex: lastDigits + "$" };
      console.log(
        `Searching for bookings with phone ending with: ${lastDigits}`
      );
    } else if (req.user.id) {
      // Fallback to finding by user ID if no phone in token
      const User = mongoose.model("User");
      const user = await User.findById(req.user.id);

      if (user && user.phone) {
        // Handle phone number with regex for flexible matching
        const phoneDigits = user.phone.replace(/\D/g, "");
        const lastDigits = phoneDigits.slice(-10);
        query.phone = { $regex: lastDigits + "$" };
        console.log(
          `Found user ID: ${req.user.id}, using phone ending with: ${lastDigits}`
        );
      } else {
        return res
          .status(400)
          .json({ message: "User has no phone number to match bookings" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "No user identification available" });
    }

    // Verify the booking exists and belongs to the user
    const booking = await Booking.findOne(query);
    console.log("Booking found:", booking ? "Yes" : "No");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or you are not authorized to review it",
      });
    }

    // Ensure the roomId is actually in the user's booking
    const roomInBooking = booking.rooms.find(
      (room) => room.roomId.toString() === roomId
    );
    if (!roomInBooking) {
      return res
        .status(400)
        .json({ message: "Invalid room ID. This room was not booked by you." });
    }

    // Check if checkout date is in the past
    if (new Date(booking.checkOut) > new Date()) {
      return res
        .status(400)
        .json({ message: "You can only review after your stay is completed" });
    }

    // Check if the user has already reviewed this specific room type in this booking
    const existingReview = await Review.findOne({
      bookingId,
      itemId: roomId,
      userId,
      bookingType: "room",
    });

    console.log("Existing Review Found:", existingReview); // Debugging

    if (existingReview) {
      return res.status(400).json({
        message:
          "You have already submitted a review for this room type in this booking.",
      });
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
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.bookingId
    ) {
      return res.status(400).json({
        message: "You have already submitted a review for this booking.",
        error: "duplicate_review",
      });
    }

    console.error("Error submitting room review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Submit a review for a tour booking
export const submitTourReview = async (req, res) => {
  const { bookingId, rating, review: comment } = req.body;
  const userId = req.user.id; // Assuming you have user data in req.user from auth middleware
  const userName = req.user.name || "Anonymous";

  try {
    console.log("Submitting tour review for booking ID:", bookingId);
    console.log("User data from token:", req.user);

    // Build a query to find the booking based on available user info
    const query = { _id: bookingId };

    // Add user identifiers to the query using phone matching logic
    if (req.user.phone) {
      // Process phone number to handle different formats
      const phoneDigits = req.user.phone.replace(/\D/g, "");
      // Match the last digits of the phone number to handle different country code formats
      const lastDigits = phoneDigits.slice(-10);
      query.phone = { $regex: lastDigits + "$" };
      console.log(
        `Searching for bookings with phone ending with: ${lastDigits}`
      );
    } else if (req.user.id) {
      // Fallback to finding by user ID if no phone in token
      const User = mongoose.model("User");
      const user = await User.findById(req.user.id);

      if (user && user.phone) {
        // Handle phone number with regex for flexible matching
        const phoneDigits = user.phone.replace(/\D/g, "");
        const lastDigits = phoneDigits.slice(-10);
        query.phone = { $regex: lastDigits + "$" };
        console.log(
          `Found user ID: ${req.user.id}, using phone ending with: ${lastDigits}`
        );
      } else {
        return res
          .status(400)
          .json({ message: "User has no phone number to match bookings" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "No user identification available" });
    }

    // Verify the booking exists and belongs to the user
    const booking = await TourBooking.findOne(query);
    console.log("Booking found:", booking ? "Yes" : "No");

    if (!booking) {
      return res.status(404).json({
        message:
          "Tour booking not found or you are not authorized to review it",
      });
    }

    // Check if tour date is in the past
    const tourDate = new Date(booking.bookingDate);
    const currentDate = new Date();

    if (tourDate > currentDate) {
      return res
        .status(400)
        .json({ message: "You can only review after your tour is completed" });
    }

    // Check if a review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        message: "You have already submitted a review for this booking",
      });
    }

    // Get the tour ID
    const itemId = booking.tour;

    // Create the review
    const newReview = new Review({
      userId,
      userName,
      bookingId,
      bookingType: "tour",
      itemId,
      rating: parseInt(rating),
      comment: comment || "",
    });

    // Save the review
    await newReview.save();

    // Update average rating on the tour (optional)
    await updateTourRating(itemId);

    return res.status(201).json({
      message: "Tour review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error submitting tour review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Helper function to update room average rating
async function updateRoomRating(roomId) {
  try {
    const reviews = await Review.find({
      itemId: roomId,
      bookingType: "room",
      status: "approved",
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      await Room.findByIdAndUpdate(roomId, {
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
      });
    }
  } catch (error) {
    console.error("Error updating room rating:", error);
  }
}

// Helper function to update tour average rating
async function updateTourRating(tourId) {
  try {
    console.log(`Updating average rating for tour ID: ${tourId}`);

    // Find all approved reviews for this tour
    const reviews = await Review.find({
      itemId: tourId,
      bookingType: "tour",
      status: "approved",
    });

    console.log(`Found ${reviews.length} approved reviews for this tour`);

    if (reviews.length > 0) {
      // Calculate total rating
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      console.log(
        `Total rating sum: ${totalRating}, Average: ${averageRating.toFixed(1)}`
      );

      // Update the tour with the new rating information
      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        {
          averageRating: parseFloat(averageRating.toFixed(1)),
          reviewCount: reviews.length,
        },
        { new: true }
      );

      if (updatedTour) {
        console.log(
          `Successfully updated tour rating: ${updatedTour.averageRating} (${updatedTour.reviewCount} reviews)`
        );
      } else {
        console.error(`Tour with ID ${tourId} not found during rating update`);
      }
    } else {
      // If no reviews, set rating to 0 and count to 0
      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        {
          averageRating: 0,
          reviewCount: 0,
        },
        { new: true }
      );

      console.log(`No reviews for tour. Reset rating to 0.`);
    }
  } catch (error) {
    console.error("Error updating tour rating:", error);
  }
}

// Get reviews for a specific room
export const getRoomReviews = async (req, res) => {
  const { roomId } = req.params;

  try {
    const reviews = await Review.find({
      itemId: roomId,
      bookingType: "room",
      status: "approved",
    }).sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching room reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get reviews for a specific tour
export const getTourReviews = async (req, res) => {
  const { tourId } = req.params;

  try {
    const reviews = await Review.find({
      itemId: tourId,
      bookingType: "tour",
      status: "approved",
    }).sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching tour reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get a user's reviews
export const getUserReviews = async (req, res) => {
  console.log("User data from token:", req.user);

  // Check if user data exists in the request
  if (!req.user) {
    return res.status(400).json({ message: "User not found in token" });
  }

  try {
    let userId = req.user.id;

    // If we don't have a user ID directly, try to find the user by phone
    if (!userId && req.user.phone) {
      const User = mongoose.model("User");

      // Process phone number to handle different formats
      const phoneDigits = req.user.phone.replace(/\D/g, "");
      const lastDigits = phoneDigits.slice(-10);

      // Search for the user with this phone number pattern
      console.log(`Searching for user with phone ending with: ${lastDigits}`);
      const user = await User.findOne({
        phone: { $regex: lastDigits + "$" },
      });

      if (user) {
        userId = user._id;
        console.log(`Found user with ID: ${userId} by phone matching`);
      } else {
        // Return empty array if user not found
        console.log(
          "User not found for reviews by phone matching, returning empty array"
        );
        return res.status(200).json([]);
      }
    }

    if (!userId) {
      // Return empty array if no user ID is available
      console.log("No user ID available for reviews, returning empty array");
      return res.status(200).json([]);
    }

    console.log("Fetching reviews for user ID:", userId);

    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${reviews.length} reviews for user ID: ${userId}`);

    // Always return the reviews array (empty if none found)
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a review (user can delete their own review)
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  try {
    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        message: "Review not found or you are not authorized to delete it",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update average rating for the item
    if (review.bookingType === "room") {
      await updateRoomRating(review.itemId);
    } else {
      await updateTourRating(review.itemId);
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Admin: Get all user reviews (for admin dashboard)
export const getAllUserReviews = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Admin access required." });
    }

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Get total count of reviews
    const totalReviews = await Review.countDocuments();

    // Fetch paginated reviews
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      reviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      totalReviews,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: "Failed to fetch user reviews" });
  }
};

// Admin: Update review status (approve/reject)
export const updateReviewStatus = async (req, res) => {
  const { reviewId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
    });
  }

  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Admin access required." });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update the status
    review.status = status;
    await review.save();

    // If status changed to/from approved, update item ratings
    if (status === "approved" || review.status === "approved") {
      if (review.bookingType === "room") {
        await updateRoomRating(review.itemId);
      } else {
        await updateTourRating(review.itemId);
      }
    }

    return res.status(200).json({
      message: "Review status updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating review status:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Admin: Delete any review (admin privilege)
export const adminDeleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Admin access required." });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Store the review details before deleting for rating update
    const { itemId, bookingType } = review;

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update average rating for the item
    if (bookingType === "room") {
      await updateRoomRating(itemId);
    } else {
      await updateTourRating(itemId);
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Admin: Get reviews with filtering options
export const getFilteredReviews = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Admin access required." });
    }

    const { status, bookingType, dateFrom, dateTo, minRating, maxRating } =
      req.query;

    // Build filter object
    const filter = {};

    // Add filters based on query parameters
    if (status && status !== "all") {
      filter.status = status;
    }

    if (bookingType && bookingType !== "all") {
      filter.bookingType = bookingType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Rating range filter
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) {
        filter.rating.$gte = parseInt(minRating);
      }
      if (maxRating) {
        filter.rating.$lte = parseInt(maxRating);
      }
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).populate({
      path: "itemId",
      select: "name title",
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching filtered reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
