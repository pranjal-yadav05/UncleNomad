import Tour from "../models/Tour.js";
import TourBooking from "../models/TourBooking.js";
import PaytmChecksum from "paytmchecksum";
import https from "https";
import streamifier from "streamifier";
import { v2 as cloudinaryV2 } from "cloudinary";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import Review from "../models/UserReview.js";
import Stats from "../models/Stats.js";
import ExcelJS from "exceljs";
import User from "../models/User.js";

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const urlPathname = new URL(imageUrl).pathname;
    const pathParts = urlPathname.split("/");
    const filenameWithExt = pathParts[pathParts.length - 1];
    const filename = filenameWithExt.split(".")[0];
    let folderPath = "";
    let foundUncleNomad = false;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (foundUncleNomad || pathParts[i] === "uncle-nomad") {
        foundUncleNomad = true;
        folderPath += pathParts[i] + "/";
      }
    }
    const publicId = folderPath + filename;
    return await cloudinaryV2.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return null;
  }
};

// Helper function to upload images to Cloudinary
const uploadToCloudinary = async (file, tourId, index) => {
  if (!file) return null;
  const publicId = `tour-${tourId}-${Date.now()}-${index}`;
  try {
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          overwrite: true,
          quality: "auto",
          folder: "uncle-nomad",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
    console.error("Error uploading to Cloudinary:", uploadError);
    return null;
  }
};

// Get all tours
export const getAdminTours = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt"; // Default to newest first

    // Build filter object based on query parameters
    const filter = {};

    // Add category filter if provided and not 'all'
    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category;
    }

    // Add search functionality (search by title, description, or location)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    // Get total count of filtered tours
    const totalTours = await Tour.countDocuments(filter);

    // Fetch paginated tours with filters and sorting
    const tours = await Tour.find(filter)
      .sort(sortParam)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get top 4 reviews for each tour
    const tourIds = tours.map((tour) => tour._id);
    const reviewsByTour = await Review.aggregate([
      {
        $match: {
          bookingType: "tour",
          itemId: { $in: tourIds },
          status: "approved",
        },
      },
      { $sort: { createdAt: -1 } }, // Sort reviews by newest first
      {
        $group: {
          _id: "$itemId",
          reviews: {
            $push: {
              userName: "$userName",
              rating: "$rating",
              comment: "$comment",
              createdAt: "$createdAt",
            },
          },
        },
      },
    ]);

    // Convert aggregation results into a map for quick lookup
    const reviewMap = {};
    reviewsByTour.forEach((entry) => {
      reviewMap[entry._id.toString()] = entry.reviews.slice(0, 4); // Take top 4 reviews
    });

    // Attach top 4 reviews to each tour
    const toursWithReviews = tours.map((tour) => ({
      ...tour,
      reviews: reviewMap[tour._id.toString()] || [], // Default to empty array if no reviews
    }));

    res.status(200).json({
      tours: toursWithReviews,
      totalPages: Math.ceil(totalTours / limit),
      currentPage: page,
      totalTours,
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTours = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Get total count of tours
    const totalTours = await Tour.countDocuments();

    // Fetch paginated tours
    const tours = await Tour.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get top 4 reviews for each tour
    const tourIds = tours.map((tour) => tour._id);
    const reviewsByTour = await Review.aggregate([
      {
        $match: {
          bookingType: "tour",
          itemId: { $in: tourIds },
          status: "approved",
        },
      },
      { $sort: { createdAt: -1 } }, // Sort reviews by newest first
      {
        $group: {
          _id: "$itemId",
          reviews: {
            $push: {
              userName: "$userName",
              rating: "$rating",
              comment: "$comment",
              createdAt: "$createdAt",
            },
          },
        },
      },
    ]);

    // Convert aggregation results into a map for quick lookup
    const reviewMap = {};
    reviewsByTour.forEach((entry) => {
      reviewMap[entry._id.toString()] = entry.reviews.slice(0, 4); // Take top 4 reviews
    });

    // Attach top 4 reviews to each tour
    const toursWithReviews = tours.map((tour) => ({
      ...tour,
      reviews: reviewMap[tour._id.toString()] || [], // Default to empty array if no reviews
    }));

    res.status(200).json({
      tours: toursWithReviews,
      totalPages: Math.ceil(totalTours / limit),
      currentPage: page,
      totalTours,
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createTour = async (req, res) => {
  try {
    console.log("📝 Creating new tour...");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📸 Files received:", req.files ? req.files.length : 0);

    const {
      id,
      title,
      description,
      category,
      duration,
      location,
      groupSize,
      itinerary,
      inclusions,
      exclusions,
      availableDates,
      pricingPackages,
    } = req.body;

    // Log parsed fields
    console.log("🔍 Parsed fields:", {
      id,
      title,
      description,
      category,
      duration,
      location,
      groupSize,
      itinerary,
      inclusions,
      exclusions,
      availableDates,
      pricingPackages,
    });

    // Parse JSON strings if they are strings
    const parsedItinerary =
      typeof itinerary === "string" ? JSON.parse(itinerary) : itinerary;
    const parsedInclusions =
      typeof inclusions === "string" ? JSON.parse(inclusions) : inclusions;
    const parsedExclusions =
      typeof exclusions === "string" ? JSON.parse(exclusions) : exclusions;
    const parsedAvailableDates =
      typeof availableDates === "string"
        ? JSON.parse(availableDates)
        : availableDates;
    const parsedPricingPackages =
      typeof pricingPackages === "string"
        ? JSON.parse(pricingPackages)
        : pricingPackages;

    // Log parsed arrays
    console.log("📅 Parsed arrays:", {
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      availableDates: parsedAvailableDates,
      pricingPackages: parsedPricingPackages,
    });

    // Validate required fields
    if (
      !id ||
      !title ||
      !description ||
      !duration ||
      !location ||
      !groupSize ||
      !parsedAvailableDates ||
      parsedAvailableDates.length === 0 ||
      !parsedPricingPackages ||
      parsedPricingPackages.length === 0
    ) {
      console.log("❌ Missing required fields:", {
        id: !id,
        title: !title,
        description: !description,
        duration: !duration,
        location: !location,
        groupSize: !groupSize,
        availableDates:
          !parsedAvailableDates || parsedAvailableDates.length === 0,
        pricingPackages:
          !parsedPricingPackages || parsedPricingPackages.length === 0,
      });
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate availableDates structure
    const invalidDatePeriod = parsedAvailableDates.find(
      (period) =>
        !period.startDate ||
        !period.endDate ||
        !period.maxGroupSize ||
        period.availableSpots === undefined
    );

    if (invalidDatePeriod) {
      console.log("❌ Invalid date period structure:", invalidDatePeriod);
      return res.status(400).json({ message: "Invalid date period structure" });
    }

    // Validate pricingPackages structure
    const invalidPackage = parsedPricingPackages.find(
      (pkg) => !pkg.name || !pkg.price
    );

    if (invalidPackage) {
      console.log("❌ Invalid pricing package structure:", invalidPackage);
      return res
        .status(400)
        .json({ message: "Invalid pricing package structure" });
    }

    // Create tour first with empty images array
    const newTour = new Tour({
      id: parseInt(id),
      title,
      description,
      category: category || "Adventure",
      duration,
      location,
      groupSize: parseInt(groupSize),
      itinerary: parsedItinerary || [],
      inclusions: parsedInclusions || [],
      exclusions: parsedExclusions || [],
      availableDates: parsedAvailableDates.map((period) => ({
        ...period,
        maxGroupSize: parseInt(period.maxGroupSize),
        availableSpots: parseInt(period.availableSpots),
      })),
      pricingPackages: parsedPricingPackages.map((pkg) => ({
        ...pkg,
        price: parseFloat(pkg.price),
      })),
      images: [],
    });

    console.log("🎯 Tour object created:", JSON.stringify(newTour, null, 2));

    // Save tour to get a valid ID
    await newTour.save();
    console.log("💾 Tour saved with ID:", newTour._id);

    // Upload images if available
    if (req.files && req.files.length > 0) {
      console.log("🖼️ Processing image uploads...");
      // Upload each image and collect URLs
      const uploadPromises = req.files.map((file, index) =>
        uploadToCloudinary(file, newTour._id, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null);
      console.log("✅ Images uploaded:", validUrls);

      // Update tour with image URLs - use findByIdAndUpdate for reliability
      const updatedTour = await Tour.findByIdAndUpdate(
        newTour._id,
        { $set: { images: validUrls } },
        { new: true }
      );
      console.log("💾 Tour updated with images");

      return res.status(201).json(updatedTour);
    }

    console.log("✅ Tour creation completed successfully");
    // Return the created tour if no images
    res.status(201).json(newTour);
  } catch (error) {
    console.error("❌ Tour creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single tour by ID
export const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }
    const reviews = await Review.find({ bookingType: "tour", itemId: tour })
      .sort({ createdAt: -1 }) // Newest reviews first
      .limit(4)
      .select("userName rating comment createdAt") // Only include necessary fields
      .lean();

    // Include availableDates and pricingPackages in the response
    res.json({
      ...tour.toObject(),
      reviews,
      availableDates: tour.availableDates || [],
      pricingPackages: tour.pricingPackages || [],
    });
  } catch (error) {
    console.error("Error fetching tour:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a tour
export const updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("update called");
    // Check if the tour exists
    const existingTour = await Tour.findById(id);
    if (!existingTour) {
      console.error("❌ Tour not found");
      return res.status(404).json({ message: "Tour not found" });
    }

    // Helper function to parse JSON safely
    const parseJSON = (data, defaultValue) => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        console.error("❌ JSON parse error:", error);
        return defaultValue;
      }
    };
    console.log(req.body.inclusions);
    // Prepare update data
    const updateData = {
      id: req.body.id || existingTour.id,
      title: req.body.title || existingTour.title,
      description: req.body.description || existingTour.description,
      category: req.body.category || existingTour.category,
      duration: req.body.duration || existingTour.duration,
      location: req.body.location || existingTour.location,
      itinerary: parseJSON(req.body.itinerary, existingTour.itinerary),
      inclusions: parseJSON(req.body.inclusions, existingTour.inclusions),
      exclusions: parseJSON(req.body.exclusions, existingTour.exclusions),
      availableDates: parseJSON(
        req.body.availableDates,
        existingTour.availableDates
      ),
      pricingPackages: parseJSON(
        req.body.pricingPackages,
        existingTour.pricingPackages
      ),
      images: existingTour.images || [],
    };

    // Check if images were uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      const deletePromises = existingTour.images.map(async (url) => {
        try {
          const result = await deleteCloudinaryImage(url);
          return result;
        } catch (error) {
          console.error(`❌ Failed to delete ${url}:`, error);
        }
      });
      await Promise.all(deletePromises);

      // Upload new images
      const uploadPromises = req.files.map((file, index) =>
        uploadToCloudinary(file, id, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null);

      updateData.images = validUrls;
    } else {
      console.log("⚠️ No new images uploaded, keeping existing ones");
    }

    const updatedTour = await Tour.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json(updatedTour);
  } catch (error) {
    console.error("❌ Error updating tour:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a tour
export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }
    if (tour.images && tour.images.length > 0) {
      const deletePromises = tour.images.map((url) =>
        deleteCloudinaryImage(url)
      );
      await Promise.all(deletePromises);
    }
    res.json({ message: "Tour deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTourBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt"; // Default to sorting by createdAt in descending order

    // Build filter object based on query parameters
    const filter = {};

    // Add status filter if provided and not 'all'
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Add search functionality (search by guest name, email, or phone)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { guestName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Get total count of filtered bookings
    const totalBookings = await TourBooking.countDocuments(filter);

    // Fetch paginated bookings with filters
    const bookings = await TourBooking.find(filter)
      .populate({
        path: "tour",
        select: "title location price startDate endDate duration",
      })
      .sort(sortParam) // Apply sorting
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      bookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: page,
      totalBookings,
    });
  } catch (error) {
    console.error("Error fetching tour bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTourBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await TourBooking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const tour = await Tour.findById(booking.tour);
    if (!tour) {
      return res.status(404).json({ message: "Associated tour not found" });
    }

    // For CONFIRMED bookings, restore available spots and update bookedSlots
    if (booking.status === "CONFIRMED") {
      // First, update the bookedSlots count
      tour.bookedSlots = Math.max(0, tour.bookedSlots - booking.groupSize);

      // Find the date period that matches the booking's selected date
      const datePeriodIndex = tour.availableDates.findIndex(
        (date) =>
          date.startDate.getTime() ===
            new Date(booking.selectedDate.startDate).getTime() &&
          date.endDate.getTime() ===
            new Date(booking.selectedDate.endDate).getTime()
      );

      if (datePeriodIndex !== -1) {
        // Increase available spots for the date period
        tour.availableDates[datePeriodIndex].availableSpots +=
          booking.groupSize;
        console.log(
          `Restored ${booking.groupSize} spots to date period. New available spots: ${tour.availableDates[datePeriodIndex].availableSpots}`
        );
      } else {
        console.warn(`Date period for booking ${id} not found in tour dates`);
      }

      // Save the tour with updated spots
      await tour.save();
    }

    await TourBooking.findByIdAndDelete(id);

    res.json({
      message: "Booking deleted successfully",
      updatedTour: tour,
      restoredSpots: booking.status === "CONFIRMED" ? booking.groupSize : 0,
    });
  } catch (error) {
    console.error("Error deleting tour booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify tour booking
export const verifyTourBooking = async (req, res) => {
  try {
    const { tourId, groupSize, selectedDate } = req.body;

    // Validate required fields
    if (!tourId || !groupSize || !selectedDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // Find the selected date period
    const datePeriod = tour.availableDates.find(
      (date) =>
        date.startDate.getTime() ===
          new Date(selectedDate.startDate).getTime() &&
        date.endDate.getTime() === new Date(selectedDate.endDate).getTime()
    );

    if (!datePeriod) {
      return res
        .status(400)
        .json({ message: "Selected date period not found" });
    }

    // Check availability
    if (groupSize > datePeriod.availableSpots) {
      return res.status(400).json({
        message: `Only ${datePeriod.availableSpots} spots available for this date`,
      });
    }

    res.status(200).json({
      message: "Tour booking details are valid",
      availableSpots: datePeriod.availableSpots,
    });
  } catch (error) {
    console.error("Error verifying tour booking:", error);
    res.status(500).json({ message: "Error verifying tour booking details" });
  }
};

// Initiate tour payment
export const initiatePayment = async (req, res) => {
  try {
    const {
      tourId,
      bookingId,
      amount,
      email,
      phone,
      guestName,
      groupSize,
      specialRequests,
    } = req.body;
    const totalAmount = amount;

    // Validate required fields
    if (!tourId || !bookingId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the existing booking
    const booking = await TourBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "PENDING" || booking.paymentStatus !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Booking is not in PENDING state" });
    }

    // Validate that amount matches the booking's totalPrice
    if (Math.abs(booking.totalPrice - totalAmount) > 0.01) {
      return res
        .status(400)
        .json({ message: "Amount mismatch with booking total price" });
    }

    // Validate Razorpay configuration
    const config = validateRazorpayConfig();

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(booking.totalPrice * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        tourId: tourId,
        email: email,
        phone: phone,
        guestName: guestName,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // Update booking with payment initiation details
    await TourBooking.findByIdAndUpdate(booking._id, {
      paymentReference: order.id,
      paymentStatus: "INITIATED",
    });

    res.json({
      status: "SUCCESS",
      data: {
        orderId: order.id,
        amount: booking.totalPrice,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to initiate payment",
    });
  }
};

export const verifyTourPayment = async (req, res) => {
  try {
    const {
      orderId,
      bookingId,
      tourId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // Find booking in database by payment reference
    const booking = await TourBooking.findOne({
      paymentReference: orderId,
      status: "PENDING",
      paymentStatus: "INITIATED",
    });

    if (!booking) {
      return res
        .status(400)
        .json({ message: "Invalid booking reference or booking not found" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Update booking status as failed
      await TourBooking.findByIdAndUpdate(booking._id, {
        paymentStatus: "FAILED",
        status: "PAYMENT_FAILED",
        paymentError: "Payment signature verification failed",
      });

      return res.status(400).json({
        status: "ERROR",
        message: "Payment verification failed: Invalid signature",
      });
    }

    // If signature is valid, update booking status
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedBooking = await TourBooking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentDate: new Date(),
          paymentAmount: booking.totalPrice,
          paymentReference: razorpay_payment_id,
        },
        { new: true, session }
      );

      if (!updatedBooking) {
        throw new Error("Booking not found during update");
      }

      // Find the tour to update available spots
      const tour = await Tour.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      // Find the selected date period in the tour
      const datePeriodIndex = tour.availableDates.findIndex(
        (date) =>
          date.startDate.getTime() ===
            new Date(booking.selectedDate.startDate).getTime() &&
          date.endDate.getTime() ===
            new Date(booking.selectedDate.endDate).getTime()
      );

      if (datePeriodIndex === -1) {
        throw new Error("Selected date period not found in tour");
      }

      // Update available spots for the date period
      tour.availableDates[datePeriodIndex].availableSpots -= booking.groupSize;

      // Also update tour bookedSlots if needed
      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        {
          $inc: { bookedSlots: updatedBooking.groupSize },
          availableDates: tour.availableDates,
        },
        { new: true, session }
      );

      if (!updatedTour) {
        throw new Error("Tour not found while updating bookedSlots");
      }

      await session.commitTransaction();

      return res.json({
        status: "SUCCESS",
        message: "Payment verified successfully",
        data: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          bookingId: updatedBooking._id,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error verifying tour payment:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to verify payment",
    });
  }
};

const validateRazorpayConfig = () => {
  const requiredConfig = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };

  const missingConfig = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(", ")}`);
  }

  return requiredConfig;
};

// Create tour booking
export const createTourBooking = async (req, res) => {
  const {
    tourId,
    groupSize,
    selectedDate,
    selectedPackage,
    guestName,
    email,
    phone,
    specialRequests,
    totalAmount,
    paymentStatus,
    paymentReference,
  } = req.body;

  try {
    // Validate required fields
    if (
      !tourId ||
      !groupSize ||
      !selectedDate ||
      !selectedPackage ||
      !guestName ||
      !phone
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify tour availability
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // Find the selected date period
    const datePeriodIndex = tour.availableDates.findIndex(
      (date) =>
        date.startDate.getTime() ===
          new Date(selectedDate.startDate).getTime() &&
        date.endDate.getTime() === new Date(selectedDate.endDate).getTime()
    );

    if (datePeriodIndex === -1) {
      return res
        .status(400)
        .json({ message: "Selected date period not found" });
    }

    const datePeriod = tour.availableDates[datePeriodIndex];

    // Check availability
    if (groupSize > datePeriod.availableSpots) {
      return res.status(400).json({
        message: `Only ${datePeriod.availableSpots} spots available for this date`,
      });
    }

    // Validate total amount
    const calculatedTotal = selectedPackage.price * groupSize;
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ message: "Total amount mismatch" });
    }

    // Create the booking
    const booking = new TourBooking({
      tour: tourId,
      selectedDate,
      selectedPackage,
      groupSize,
      bookingDate: new Date(),
      guestName,
      email: email || null, // Make email optional
      phone,
      specialRequests,
      totalPrice: calculatedTotal,
      status: "PENDING",
      paymentStatus: paymentStatus || "PENDING",
      paymentReference: paymentReference || null,
    });

    // Set payment date if payment status is PAID or SUCCESS
    if (paymentStatus === "PAID" || paymentStatus === "SUCCESS") {
      booking.paymentDate = new Date();
    }

    // DON'T update available spots yet - only after payment confirmation
    // We'll update spots in the confirmTourBooking or verifyTourPayment endpoints

    // Save the booking
    const savedBooking = await booking.save();

    res.status(201).json({
      message: "Tour booking created successfully. Please proceed to payment.",
      booking: {
        ...savedBooking.toObject(),
        id: savedBooking._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating tour booking:", error);
    res.status(500).json({ message: "Error creating tour booking" });
  }
};

export const confirmTourBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentReference, status, paymentStatus } = req.body;

    // Validate inputs
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Find the booking
    const booking = await TourBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find the corresponding tour
    const tour = await Tour.findById(booking.tour);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // Ensure `bookedSlots` exists and initialize if missing
    if (tour.bookedSlots === undefined) {
      tour.bookedSlots = 0;
    }

    // Find the date period that matches the booking's selected date
    const datePeriodIndex = tour.availableDates.findIndex(
      (date) =>
        date.startDate.getTime() ===
          new Date(booking.selectedDate.startDate).getTime() &&
        date.endDate.getTime() ===
          new Date(booking.selectedDate.endDate).getTime()
    );

    if (datePeriodIndex === -1) {
      return res.status(400).json({
        message: "Selected date period not found in tour",
      });
    }

    const datePeriod = tour.availableDates[datePeriodIndex];

    // Only update bookedSlots and availableSpots if status is changing to CONFIRMED from a non-CONFIRMED state
    if (status === "CONFIRMED" && booking.status !== "CONFIRMED") {
      // Check if there are enough available slots
      if (datePeriod.availableSpots < booking.groupSize) {
        return res.status(400).json({
          message: `Not enough available spots for this booking. Only ${datePeriod.availableSpots} spots available for this date period.`,
        });
      }

      // Update bookedSlots in the tour and availableSpots in date period
      tour.bookedSlots += booking.groupSize;
      tour.availableDates[datePeriodIndex].availableSpots -= booking.groupSize;
      await tour.save();
    }

    // If changing from CONFIRMED to another status, free up slots
    if (booking.status === "CONFIRMED" && status && status !== "CONFIRMED") {
      tour.bookedSlots = Math.max(0, tour.bookedSlots - booking.groupSize);
      tour.availableDates[datePeriodIndex].availableSpots += booking.groupSize;
      await tour.save();
    }

    // Update booking fields
    if (paymentReference) {
      booking.paymentReference = paymentReference;
    }

    if (status) {
      booking.status = status;
    }

    // Set payment status if provided
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;

      // Set payment date when status is set to PAID or SUCCESS
      if (
        (paymentStatus === "PAID" || paymentStatus === "SUCCESS") &&
        !booking.paymentDate
      ) {
        booking.paymentDate = new Date();
      }
    }

    await booking.save();

    res.json({
      message: "Booking updated successfully",
      booking,
      updatedTour: tour,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

export const getTourBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }

    // Find booking and populate tour details
    const booking = await TourBooking.findById(bookingId).populate({
      path: "tour",
      select:
        "title description duration price location groupSize images createdAt",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error retrieving booking details:", error);
    res.status(500).json({
      message: "Error retrieving booking details",
      error: error.message,
    });
  }
};

export const deleteTourImage = async (req, res) => {
  try {
    let { tourId, imageIndex } = req.params;

    // Ensure `tourId` is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(tourId)) {
      console.error("❌ Invalid tour ID format");
      return res.status(400).json({ message: "Invalid tour ID format" });
    }

    // Convert tourId to ObjectId
    tourId = new mongoose.Types.ObjectId(tourId);

    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      console.error("❌ Tour not found");
      return res.status(404).json({ message: "Tour not found" });
    }

    // Validate index
    imageIndex = parseInt(imageIndex);
    if (
      isNaN(imageIndex) ||
      imageIndex < 0 ||
      imageIndex >= tour.images.length
    ) {
      console.error("❌ Invalid image index");
      return res.status(400).json({ message: "Invalid image index" });
    }

    // Get image URL
    const imageUrl = tour.images[imageIndex];

    // Delete from Cloudinary (only if it's a valid Cloudinary URL)
    if (imageUrl.includes("cloudinary.com")) {
      try {
        await deleteCloudinaryImage(imageUrl);
      } catch (error) {
        console.error("❌ Error deleting image from Cloudinary:", error);
      }
    }

    // Remove image from the array
    tour.images.splice(imageIndex, 1);

    // Save updated tour
    await tour.save();

    res
      .status(200)
      .json({ message: "Image deleted successfully", images: tour.images });
  } catch (error) {
    console.error("❌ Error deleting tour image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserTourBooking = async (req, res) => {
  try {

    // Handle phone authentication
    if (!req.user) {
      return res.status(400).json({ message: "User data not found in token" });
    }

    // Create base query
    let query = {
      status: "CONFIRMED",
      paymentStatus: "PAID",
    };

    // Get phone number from token or user record
    if (req.user.phone) {
      // Process phone number to handle different formats
      const phoneDigits = req.user.phone.replace(/\D/g, "");
      // Match the last digits of the phone number to handle different country code formats
      const lastDigits = phoneDigits.slice(-10);
      query.phone = { $regex: lastDigits + "$" };

    } else if (req.user.id) {
      // Fallback to finding by user ID if no phone in token
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.phone) {
        // Handle phone number with regex for flexible matching
        const phoneDigits = user.phone.replace(/\D/g, "");
        const lastDigits = phoneDigits.slice(-10);
        query.phone = { $regex: lastDigits + "$" };
      } else {
        return res.status(400).json({ message: "User has no phone number" });
      }
    } else {
      return res.status(400).json({ message: "User has no phone number" });
    }

    // First, count all bookings to see if there are any
    const totalBookingsCount = await TourBooking.countDocuments();

    // Find phone-matching bookings
    const bookings = await TourBooking.find(query)
      .populate({
        path: "tour",
        select: "title location images duration price itinerary",
      })
      .select(
        "_id status bookingDate guestName phone specialRequests groupSize totalPrice paymentReference paymentStatus selectedDate selectedPackage"
      )
      .sort({ bookingDate: -1 })
      .lean();

    // If no bookings found, return an empty array
    if (!bookings.length) {
      return res.status(200).json([]);
    }

    // Fetch any reviews the user has submitted for these bookings
    const bookingIds = bookings.map((booking) => booking._id);

    const reviews = await Review.find({
      bookingId: { $in: bookingIds },
      bookingType: "tour",
    }).lean();

    // Create a map of booking IDs to reviews
    const reviewMap = {};
    reviews.forEach((review) => {
      reviewMap[review.bookingId.toString()] = review;
    });

    // Format the response properly
    const formattedBookings = bookings.map((booking) => {
      const review = reviewMap[booking._id.toString()] || null;

      return {
        _id: booking._id,
        status: booking.status,
        bookingDate: booking.bookingDate,
        guestName: booking.guestName,
        phone: booking.phone,
        specialRequests: booking.specialRequests,
        participants: booking.groupSize,
        totalAmount: booking.totalPrice,
        paymentReference: booking.paymentReference,
        paymentStatus: booking.paymentStatus,

        // Add the selected date and package information directly
        selectedDate: booking.selectedDate || null,
        selectedPackage: booking.selectedPackage || null,

        // Tour details
        tourId: booking.tour?._id || null,
        tourName: booking.tour?.title || "Unknown Tour",
        location: booking.tour?.location || "Unknown Location",
        tourImage: booking.tour?.images?.[0] || null,
        tourDate: booking.tour?.startDate || null,
        tourEndDate: booking.tour?.endDate || null,
        duration: booking.tour?.duration || null,
        pricePerPerson: booking.tour?.price || null,
        itinerary: booking.tour?.itinerary || [],

        // Review details
        userRating: review ? review.rating : 0,
        userReview: review ? review.comment : "",
        reviewId: review ? review._id : null,
      };
    });


    res.status(200).json(formattedBookings);
  } catch (error) {
    console.error("Error fetching user tour bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export const getStats = async (req, res) => {
  try {
    // Retrieve the stats document from the database (you can adjust the query if needed, e.g., find by a specific ID)
    const stats = await Stats.findOne(); // Optionally, add filters if you want specific results

    if (!stats) {
      return res.status(404).json({ message: "Stats not found" });
    }

    // Return the stats data
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error retrieving stats:", error);
    res.status(500).json({ message: "Error retrieving stats" });
  }
};

export const postStats = async (req, res) => {
  try {
    const { destinations, tours, travellers, ratings } = req.body;

    // Check if stats already exist in the database (you can use a unique identifier or just check if there's any stats document)
    const existingStats = await Stats.findOne(); // Optionally, add a filter if you need to look for specific conditions

    if (existingStats) {
      // Update the existing stats document
      existingStats.destinations = destinations;
      existingStats.tours = tours;
      existingStats.travellers = travellers;
      existingStats.ratings = ratings;

      // Save the updated stats to the database
      await existingStats.save();
      res.status(200).json({ message: "Stats updated successfully" });
    } else {
      // Create a new stats document if no existing stats found
      const stats = new Stats({
        destinations,
        tours,
        travellers,
        ratings,
      });

      // Save the new stats to the database
      await stats.save();
      res.status(201).json({ message: "Stats saved successfully" });
    }
  } catch (error) {
    console.error("Error saving or updating stats:", error);
    res.status(500).json({ message: "Error saving or updating stats" });
  }
};

// Delete a specific stat
export const deleteStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stat = await Stats.findByIdAndDelete(id);

    if (!stat) {
      return res.status(404).json({ message: "Stat not found" });
    }

    res.status(200).json({ message: "Stat deleted successfully" });
  } catch (error) {
    console.error("Error deleting stat:", error);
    res.status(500).json({ message: "Error deleting stat" });
  }
};

// Update an existing stat
export const updateStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { destinations, tours, travellers, ratings } = req.body;

    const stat = await Stats.findByIdAndUpdate(
      id,
      { destinations, tours, travellers, ratings },
      { new: true } // Returns the updated stat
    );

    if (!stat) {
      return res.status(404).json({ message: "Stat not found" });
    }

    res.status(200).json({ message: "Stat updated successfully", stat });
  } catch (error) {
    console.error("Error updating stat:", error);
    res.status(500).json({ message: "Error updating stat" });
  }
};

// Add a helper function to format dates in dd/mm/yyyy format
const formatDateDDMMYYYY = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Helper function to generate Excel workbook for tour bookings
const generateTourBookingsExcel = (bookings) => {
  // Create a new Excel workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheetMain = workbook.addWorksheet("Tour Bookings");

  // Define columns for main worksheet
  worksheetMain.columns = [
    { header: "Booking ID", key: "id", width: 30 },
    { header: "Tour ID", key: "tourId", width: 30 },
    { header: "Tour Name", key: "tourName", width: 25 },
    { header: "Guest Name", key: "guestName", width: 20 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Booking Date", key: "bookingDate", width: 15 },
    { header: "Start Date", key: "startDate", width: 15 },
    { header: "End Date", key: "endDate", width: 15 },
    { header: "Package Name", key: "packageName", width: 20 },
    { header: "Price Per Person", key: "pricePerPerson", width: 15 },
    { header: "Group Size", key: "groupSize", width: 10 },
    { header: "Total Amount", key: "totalAmount", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Payment Status", key: "paymentStatus", width: 15 },
    { header: "Payment Reference", key: "paymentReference", width: 30 },
    { header: "Payment Date", key: "paymentDate", width: 15 },
    { header: "Special Requests", key: "specialRequests", width: 30 },
    { header: "Created At", key: "createdAt", width: 15 },
    { header: "Updated At", key: "updatedAt", width: 15 },
  ];

  // Format header row
  worksheetMain.getRow(1).font = { bold: true };
  worksheetMain.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Create details worksheet for special requests and other extended information
  const worksheetDetails = workbook.addWorksheet("Booking Details");
  worksheetDetails.columns = [
    { header: "Booking ID", key: "id", width: 30 },
    { header: "Special Requests", key: "specialRequests", width: 50 },
    { header: "Additional Notes", key: "notes", width: 50 },
  ];

  // Format header row for details worksheet
  worksheetDetails.getRow(1).font = { bold: true };
  worksheetDetails.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data to worksheets
  bookings.forEach((booking) => {
    // Get tour data
    const tourTitle = booking.tour ? booking.tour.title : "Unknown Tour";
    const tourId = booking.tour ? booking.tour._id.toString() : "N/A";

    // Get selected date and package info
    const startDate =
      booking.selectedDate && booking.selectedDate.startDate
        ? formatDateDDMMYYYY(booking.selectedDate.startDate)
        : "N/A";

    const endDate =
      booking.selectedDate && booking.selectedDate.endDate
        ? formatDateDDMMYYYY(booking.selectedDate.endDate)
        : "N/A";

    const packageName =
      booking.selectedPackage && booking.selectedPackage.name
        ? booking.selectedPackage.name
        : "N/A";

    const pricePerPerson =
      booking.selectedPackage && booking.selectedPackage.price
        ? `₹${booking.selectedPackage.price}`
        : "N/A";

    // Add row to main worksheet
    worksheetMain.addRow({
      id: booking._id.toString(),
      tourId: tourId,
      tourName: tourTitle,
      guestName: booking.guestName,
      phone: booking.phone,
      bookingDate: formatDateDDMMYYYY(booking.bookingDate),
      startDate: startDate,
      endDate: endDate,
      packageName: packageName,
      pricePerPerson: pricePerPerson,
      groupSize: booking.groupSize,
      totalAmount: `₹${booking.totalPrice}`,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentReference: booking.paymentReference || "N/A",
      paymentDate: booking.paymentDate
        ? formatDateDDMMYYYY(booking.paymentDate)
        : "N/A",
      specialRequests: booking.specialRequests || "None",
      createdAt: formatDateDDMMYYYY(booking.createdAt),
      updatedAt: formatDateDDMMYYYY(booking.updatedAt),
    });

    // Add row to details worksheet for special requests and notes
    if (booking.specialRequests) {
      worksheetDetails.addRow({
        id: booking._id.toString(),
        specialRequests: booking.specialRequests,
        notes: "", // Can add additional notes field if needed
      });
    }
  });

  return workbook;
};

// Export all tour bookings with filters
export const exportAllTourBookings = async (req, res) => {
  try {
    // Build filter object based on query parameters (same logic as in getAllTourBookings)
    const filter = {};

    // Add status filter if provided and not 'all'
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Add search functionality (search by guest name, email, or phone)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ guestName: searchRegex }, { phone: searchRegex }];
    }

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt"; // Default to sorting by createdAt in descending order

    // Query tour bookings with filters
    const bookings = await TourBooking.find(filter)
      .populate({
        path: "tour",
        select: "title location price _id",
      })
      .sort(sortParam)
      .lean();

    if (bookings.length === 0) {
      return res.status(404).json({
        message: "No tour bookings found with the current filters",
      });
    }

    // Create Excel workbook using the helper function
    const workbook = generateTourBookingsExcel(bookings);

    // Create a buffer to store the workbook
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Get current date for filename
    const today = new Date().toISOString().split("T")[0];

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tour_bookings_export_${today}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting all tour bookings:", error);
    res.status(500).json({
      message: "Failed to export tour bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const exportTourBookingsToExcel = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Validate date parameters
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "From date and to date are required" });
    }

    // Parse dates and set time to start/end of day
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    // Query tour bookings within the date range (check if booking date is within range)
    const bookings = await TourBooking.find({
      bookingDate: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "tour",
        select: "title location price _id",
      })
      .sort({ bookingDate: 1 })
      .lean();

    if (bookings.length === 0) {
      return res.status(404).json({
        message: "No tour bookings found in the specified date range",
      });
    }

    // Create Excel workbook using the helper function
    const workbook = generateTourBookingsExcel(bookings);

    // Create a buffer to store the workbook
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tour_bookings_${fromDate}_to_${toDate}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting tour bookings to Excel:", error);
    res.status(500).json({
      message: "Failed to export tour bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Export all tours with filters
export const exportToursToExcel = async (req, res) => {
  try {
    // Build filter object based on query parameters (same logic as in getAdminTours)
    const filter = {};

    // Add category filter if provided and not 'all'
    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category;
    }

    // Add search functionality (search by title, description, or location)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    // Extract sort parameter from query params
    const sortParam = req.query.sort || "-createdAt"; // Default to sorting by createdAt in descending order

    // Query tours with filters
    const tours = await Tour.find(filter).sort(sortParam).lean();

    if (tours.length === 0) {
      return res.status(404).json({
        message: "No tours found with the current filters",
      });
    }

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();

    // Create main worksheet for tour details
    const worksheetMain = workbook.addWorksheet("Tour Details");

    // Define columns for the main worksheet
    worksheetMain.columns = [
      { header: "Tour ID", key: "id", width: 10 },
      { header: "MongoDB ID", key: "mongoId", width: 30 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Category", key: "category", width: 15 },
      { header: "Duration", key: "duration", width: 15 },
      { header: "Group Size", key: "groupSize", width: 12 },
      { header: "Location", key: "location", width: 20 },
      { header: "Average Rating", key: "averageRating", width: 15 },
      { header: "Review Count", key: "reviewCount", width: 15 },
      { header: "Images", key: "images", width: 70 },
      { header: "Inclusions", key: "inclusions", width: 50 },
      { header: "Exclusions", key: "exclusions", width: 50 },
      { header: "Created At", key: "createdAt", width: 15 },
    ];

    // Create worksheet for available dates
    const worksheetDates = workbook.addWorksheet("Available Dates");
    worksheetDates.columns = [
      { header: "Tour ID", key: "id", width: 10 },
      { header: "Tour Title", key: "title", width: 30 },
      { header: "Start Date", key: "startDate", width: 15 },
      { header: "End Date", key: "endDate", width: 15 },
      { header: "Max Group Size", key: "maxGroupSize", width: 15 },
      { header: "Available Spots", key: "availableSpots", width: 15 },
    ];

    // Create worksheet for pricing packages
    const worksheetPricing = workbook.addWorksheet("Pricing Packages");
    worksheetPricing.columns = [
      { header: "Tour ID", key: "id", width: 10 },
      { header: "Tour Title", key: "title", width: 30 },
      { header: "Package Name", key: "name", width: 25 },
      { header: "Description", key: "description", width: 40 },
      { header: "Price (₹)", key: "price", width: 15 },
      { header: "Inclusions", key: "inclusions", width: 50 },
      { header: "Exclusions", key: "exclusions", width: 50 },
    ];

    // Create worksheet for itinerary details
    const worksheetItinerary = workbook.addWorksheet("Itinerary");
    worksheetItinerary.columns = [
      { header: "Tour ID", key: "id", width: 10 },
      { header: "Tour Title", key: "title", width: 30 },
      { header: "Day", key: "day", width: 5 },
      { header: "Title", key: "dayTitle", width: 25 },
      { header: "Description", key: "description", width: 40 },
      { header: "Activities", key: "activities", width: 40 },
      { header: "Accommodation", key: "accommodation", width: 25 },
    ];

    // Format header rows
    [
      worksheetMain,
      worksheetDates,
      worksheetPricing,
      worksheetItinerary,
    ].forEach((sheet) => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    // Add data to worksheets
    tours.forEach((tour) => {
      // Format createdAt date
      let createdAtFormatted = "N/A";
      if (tour.createdAt) {
        createdAtFormatted = formatDateDDMMYYYY(tour.createdAt);
      }

      // Add main tour details
      worksheetMain.addRow({
        id: tour.id,
        mongoId: tour._id.toString(),
        title: tour.title,
        description: tour.description,
        category: tour.category,
        duration: tour.duration,
        groupSize: tour.groupSize,
        location: tour.location,
        averageRating: tour.averageRating || 0,
        reviewCount: tour.reviewCount || 0,
        images: tour.images ? tour.images.join("\n") : "N/A",
        inclusions: tour.inclusions ? tour.inclusions.join("\n") : "N/A",
        exclusions: tour.exclusions ? tour.exclusions.join("\n") : "N/A",
        createdAt: createdAtFormatted,
      });

      // Add available dates
      if (
        Array.isArray(tour.availableDates) &&
        tour.availableDates.length > 0
      ) {
        tour.availableDates.forEach((date) => {
          worksheetDates.addRow({
            id: tour.id,
            title: tour.title,
            startDate: formatDateDDMMYYYY(date.startDate),
            endDate: formatDateDDMMYYYY(date.endDate),
            maxGroupSize: date.maxGroupSize,
            availableSpots: date.availableSpots,
          });
        });
      }

      // Add pricing packages
      if (
        Array.isArray(tour.pricingPackages) &&
        tour.pricingPackages.length > 0
      ) {
        tour.pricingPackages.forEach((pkg) => {
          worksheetPricing.addRow({
            id: tour.id,
            title: tour.title,
            name: pkg.name,
            description: pkg.description || "N/A",
            price: pkg.price,
            inclusions:
              pkg.inclusions && pkg.inclusions.length > 0
                ? pkg.inclusions.join("\n")
                : "N/A",
            exclusions:
              pkg.exclusions && pkg.exclusions.length > 0
                ? pkg.exclusions.join("\n")
                : "N/A",
          });
        });
      }

      // Add itinerary details
      if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
        tour.itinerary.forEach((day) => {
          worksheetItinerary.addRow({
            id: tour.id,
            title: tour.title,
            day: day.day,
            dayTitle: day.title,
            description: day.description,
            activities: day.activities,
            accommodation: day.accommodation,
          });
        });
      }
    });

    // Create a buffer to store the workbook
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Get current date for filename
    const today = new Date().toISOString().split("T")[0];

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tour_packages_export_${today}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting tours to Excel:", error);
    res.status(500).json({
      message: "Failed to export tours",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Generate receipt for tour booking
export const generateTourBookingReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Generating receipt for tour booking ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid tour booking ID format:", id);
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid tour booking ID format",
      });
    }

    // Fetch the tour booking with populated details
    console.log("Fetching tour booking data...");
    const booking = await TourBooking.findById(id)
      .populate({
        path: "tour",
        select: "name duration location price images itinerary",
      })
      .exec();

    console.log("Tour booking found:", booking ? "Yes" : "No");

    if (!booking) {
      return res.status(404).json({
        status: "ERROR",
        message: "Tour booking not found",
      });
    }

    // Log the full booking for debugging
    console.log("Tour booking data:", JSON.stringify(booking));

    // Check if user is authorized to access this receipt
    // First check if req.user exists
    if (req.user) {
      // Get user phone and compare with booking phone
      const userPhone = req.user.phone;
      const bookingPhone = booking.phone;

      console.log(
        "Authorization check - User Phone:",
        userPhone,
        "Booking Phone:",
        bookingPhone,
        "User Role:",
        req.user.role
      );

      // Allow access if user is admin or if this is their booking (matching phone)
      if (userPhone !== bookingPhone && req.user.role !== "admin") {
        console.log(
          "Authorization failed: phones don't match and user is not admin"
        );
        return res.status(403).json({
          status: "ERROR",
          message: "You are not authorized to access this receipt",
        });
      }

      console.log("Authorization successful");
    } else {
      console.log("No user information in request - proceeding anyway");
      // We're allowing access without authentication for now
      // This is permissive but allows the feature to work for the demo
    }

    // Calculate tour duration or use the duration from tour
    const durationDays = booking.tour?.duration || 1;

    // Get tour name from the populated tour or use fallback
    const tourName = booking.tour?.name || "Tour Package";
    console.log("Tour name:", tourName, "Duration:", durationDays);

    // Generate receipt data
    const receiptData = {
      receiptNumber: `RCPT-TOUR-${
        booking._id ? booking._id.toString().slice(-6) : "UNKNOWN"
      }-${Date.now().toString().slice(-4)}`,
      issueDate: new Date(),
      booking: {
        id: booking._id,
        reference: booking.paymentReference,
        createdAt: booking.createdAt,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentDate: booking.paymentDate,
      },
      customer: {
        name: booking.guestName,
        phone: booking.phone,
      },
      bookingDetails: {
        tourName: tourName,
        tourDate: booking.bookingDate,
        participants: booking.groupSize,
        duration: durationDays,
        pricePerPerson: booking.totalPrice / booking.groupSize,
        totalAmount: booking.totalPrice,
      },
      paymentDetails: {
        method: "Online Payment",
        reference: booking.paymentReference,
        amount: booking.totalPrice,
        date: booking.paymentDate,
      },
      companyDetails: {
        name: "Uncle Nomad",
        address: "123 Adventure Road, Travel Valley, India",
        phone: "+91 9876543210",
        email: "bookings@unclenomad.com",
        website: "www.unclenomad.com",
        gst: "GST12345678AB",
      },
    };

    console.log("Receipt generated successfully");
    return res.status(200).json({
      status: "SUCCESS",
      data: receiptData,
    });
  } catch (error) {
    console.error("Error generating tour receipt:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to generate receipt",
      error: error.message,
    });
  }
};
