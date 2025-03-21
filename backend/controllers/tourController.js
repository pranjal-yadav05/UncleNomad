import Tour from '../models/Tour.js';
import TourBooking from '../models/TourBooking.js';
import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import streamifier from 'streamifier';
import { v2 as cloudinaryV2 } from 'cloudinary';
import mongoose from 'mongoose';
import crypto from "crypto"
import Razorpay from "razorpay"
import Review from '../models/UserReview.js'
import Stats from '../models/Stats.js';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const urlPathname = new URL(imageUrl).pathname;
    const pathParts = urlPathname.split('/');
    const filenameWithExt = pathParts[pathParts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    let folderPath = '';
    let foundUncleNomad = false;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (foundUncleNomad || pathParts[i] === 'uncle-nomad') {
        foundUncleNomad = true;
        folderPath += pathParts[i] + '/';
      }
    }
    const publicId = folderPath + filename;
    return await cloudinaryV2.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
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
export const getTours = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Get total count of tours
    const totalTours = await Tour.countDocuments();

    // Fetch paginated tours
    const tours = await Tour.find().skip(skip).limit(limit).lean();

    // Get top 4 reviews for each tour
    const tourIds = tours.map(tour => tour._id);
    const reviewsByTour = await Review.aggregate([
      { $match: { bookingType: "tour", itemId: { $in: tourIds }, status: "approved" } },
      { $sort: { createdAt: -1 } }, // Sort reviews by newest first
      { 
        $group: { 
          _id: "$itemId", 
          reviews: { $push: { userName: "$userName", rating: "$rating", comment: "$comment", createdAt: "$createdAt" } } 
        } 
      }
    ]);

    // Convert aggregation results into a map for quick lookup
    const reviewMap = {};
    reviewsByTour.forEach(entry => {
      reviewMap[entry._id.toString()] = entry.reviews.slice(0, 4); // Take top 4 reviews
    });

    // Attach top 4 reviews to each tour
    const toursWithReviews = tours.map(tour => ({
      ...tour,
      reviews: reviewMap[tour._id.toString()] || [] // Default to empty array if no reviews
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
    const { title, description, category, price, duration, groupSize, location, itinerary, startDate, endDate } = req.body;
    
    // Create tour first with empty images array
    const newTour = new Tour({
      title, 
      description, 
      category,
      price, 
      duration, 
      groupSize, 
      location, 
      itinerary: itinerary || [], 
      startDate, 
      endDate, 
      images: []
    });
    
    // Save tour to get a valid ID
    await newTour.save();
    
    // Upload images if available
    if (req.files && req.files.length > 0) {
      
      // Upload each image and collect URLs
      const uploadPromises = req.files.map((file, index) => 
        uploadToCloudinary(file, newTour._id, index)
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);
      
      // Update tour with image URLs - use findByIdAndUpdate for reliability
      const updatedTour = await Tour.findByIdAndUpdate(
        newTour._id,
        { $set: { images: validUrls } },
        { new: true }
      );
      
      return res.status(201).json(updatedTour);
    }
    
    // Return the created tour if no images
    res.status(201).json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single tour by ID
export const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    const reviews = await Review.find({ bookingType: "tour", itemId: tour })
      .sort({ createdAt: -1 }) // Newest reviews first
      .limit(4)
      .select("userName rating comment createdAt") // Only include necessary fields
      .lean();

    res.json({ ...tour, reviews });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a tour
export const updateTour = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Prepare update data
    const updateData = {
      title: req.body.title || existingTour.title,
      description: req.body.description || existingTour.description,
      category: req.body.category || existingTour.category,
      price: req.body.price || existingTour.price,
      duration: req.body.duration || existingTour.duration,
      groupSize: req.body.groupSize || existingTour.groupSize,
      location: req.body.location || existingTour.location,
      itinerary: parseJSON(req.body.itinerary, existingTour.itinerary),
      inclusions: parseJSON(req.body.inclusions, existingTour.inclusions),
      exclusions: parseJSON(req.body.exclusions, existingTour.exclusions),
      priceOptions: parseJSON(req.body.priceOptions, existingTour.priceOptions),
      startDate: req.body.startDate || existingTour.startDate,
      endDate: req.body.endDate || existingTour.endDate,
      bookedSlots: req.body.bookedSlots || existingTour.bookedSlots,
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

    const updatedTour = await Tour.findByIdAndUpdate(id, updateData, { new: true });

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
      return res.status(404).json({ message: 'Tour not found' });
    }
    if (tour.images && tour.images.length > 0) {
      const deletePromises = tour.images.map(url => deleteCloudinaryImage(url));
      await Promise.all(deletePromises);
    }
    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllTourBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 per page
    const skip = (page - 1) * limit;

    // Get total count of bookings
    const totalBookings = await TourBooking.countDocuments();

    // Fetch paginated bookings
    const bookings = await TourBooking.find()
      .populate({
        path: "tour",
        select: "title location price startDate endDate duration",
      })
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
      return res.status(404).json({ message: 'Booking not found' });
    }

    const tour = await Tour.findById(booking.tour);
    if (!tour) {
      return res.status(404).json({ message: 'Associated tour not found' });
    }

    // Deduct bookedSlots only if the booking was confirmed
    if (booking.status === "CONFIRMED") {
      tour.bookedSlots = Math.max(0, tour.bookedSlots - booking.groupSize);
      await tour.save();
    }

    await TourBooking.findByIdAndDelete(id);

    res.json({ message: 'Booking deleted successfully', updatedTour: tour });
  } catch (error) {
    console.error('Error deleting tour booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Tour booking functions
export const verifyTourBooking = async (req, res) => {
  try {
    const { tourId, groupSize, bookingDate } = req.body;

    // Validate required fields
    if (!tourId || !groupSize || !bookingDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Check availability for the booking date
    const overlappingBookings = await TourBooking.find({
      tour: tourId,
      bookingDate: new Date(bookingDate),
      status: 'CONFIRMED'
    });

    // Calculate total booked group size
    const totalBooked = overlappingBookings.reduce((sum, booking) => sum + booking.groupSize, 0);

    // Check if requested group size is available
    if (groupSize > (tour.groupSize - totalBooked)) {
      return res.status(400).json({ 
        message: `Only ${tour.groupSize - totalBooked} spots available for this tour`
      });
    }

    res.status(200).json({ 
      message: 'Tour booking details are valid',
      availableSlots: tour.groupSize - totalBooked,
      totalPrice: tour.price * groupSize
    });
  } catch (error) {
    console.error('Error verifying tour booking:', error);
    res.status(500).json({ message: 'Error verifying tour booking details' });
  }
};

// Initiate tour payment
export const initiatePayment = async (req, res) => {
  try {
    const { tourId, bookingId, amount, email, phone, guestName, groupSize, specialRequests } = req.body
    const totalAmount = amount

    // Validate required fields
    if (!tourId || !bookingId || !amount) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Find the existing booking
    const booking = await TourBooking.findById(bookingId)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.status !== "PENDING" || booking.paymentStatus !== "PENDING") {
      return res.status(400).json({ message: "Booking is not in PENDING state" })
    }

    // Validate that amount matches the booking's totalPrice
    if (Math.abs(booking.totalPrice - totalAmount) > 0.01) {
      return res.status(400).json({ message: "Amount mismatch with booking total price" })
    }

    // Validate Razorpay configuration
    const config = validateRazorpayConfig()

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    })

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
    }

    const order = await razorpay.orders.create(orderOptions)

    // Update booking with payment initiation details
    await TourBooking.findByIdAndUpdate(booking._id, {
      paymentReference: order.id,
      paymentStatus: "INITIATED",
    })

    res.json({
      status: "SUCCESS",
      data: {
        orderId: order.id,
        amount: booking.totalPrice,
      },
    })
  } catch (error) {
    console.error("Error initiating payment:", error)
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to initiate payment",
    })
  }
}

export const verifyTourPayment = async (req, res) => {
  try {
    const { orderId, bookingId, tourId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body

    // Find booking in database by payment reference
    const booking = await TourBooking.findOne({
      paymentReference: orderId,
      status: "PENDING",
      paymentStatus: "INITIATED",
    })

    if (!booking) {
      return res.status(400).json({ message: "Invalid booking reference or booking not found" })
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    const isSignatureValid = generatedSignature === razorpay_signature

    if (!isSignatureValid) {
      // Update booking status as failed
      await TourBooking.findByIdAndUpdate(booking._id, {
        paymentStatus: "FAILED",
        status: "PAYMENT_FAILED",
        paymentError: "Payment signature verification failed",
      })

      return res.status(400).json({
        status: "ERROR",
        message: "Payment verification failed: Invalid signature",
      })
    }

    // If signature is valid, update booking status
    const session = await mongoose.startSession()
    session.startTransaction()

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
        { new: true, session },
      )

      if (!updatedBooking) {
        throw new Error("Booking not found during update")
      }

      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        { $inc: { bookedSlots: updatedBooking.groupSize } }, // Increase booked slots
        { new: true, session },
      )

      if (!updatedTour) {
        throw new Error("Tour not found while updating bookedSlots")
      }

      await session.commitTransaction()

      return res.json({
        status: "SUCCESS",
        message: "Payment verified successfully",
        data: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          bookingId: updatedBooking._id,
        },
      })
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    console.error("Error verifying tour payment:", error)
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to verify payment",
    })
  }
}

const validateRazorpayConfig = () => {
  const requiredConfig = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  }

  const missingConfig = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(", ")}`)
  }

  return requiredConfig
}


export const createTourBooking = async (req, res) => {
  const { tourId, groupSize, bookingDate, guestName, email, phone, specialRequests, totalAmount } = req.body

  try {
    // Validate required fields
    if (!tourId || !groupSize || !bookingDate || !guestName || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Verify tour availability
    const tour = await Tour.findById(tourId)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }

    const overlappingBookings = await TourBooking.find({
      tour: tourId,
      bookingDate: new Date(bookingDate),
      status: "CONFIRMED",
    })

    const totalBooked = overlappingBookings.reduce((sum, booking) => sum + booking.groupSize, 0)

    if (groupSize > tour.groupSize - totalBooked) {
      return res.status(400).json({
        message: `Only ${tour.groupSize - totalBooked} spots available for this tour`,
      })
    }

    // Validate total amount
    const calculatedTotal = tour.price * groupSize
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ message: "Total amount mismatch" })
    }

    // Create the booking with PENDING status
    const booking = new TourBooking({
      tour: tourId,
      groupSize,
      bookingDate: new Date(bookingDate),
      guestName,
      email,
      phone,
      specialRequests,
      totalPrice: calculatedTotal,
      status: "PENDING",
      paymentStatus: "PENDING",
    })

    // Save the booking
    const savedBooking = await booking.save()

    res.status(201).json({
      message: "Tour booking created successfully. Please proceed to payment.",
      booking: {
        ...savedBooking.toObject(),
        id: savedBooking._id.toString(), // Explicitly map _id to id
      },
    })
  } catch (error) {
    console.error("Error creating tour booking:", error)
    res.status(500).json({ message: "Error creating tour booking" })
  }
}
export const confirmTourBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentReference, status } = req.body;
    // Find the booking
    const booking = await TourBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure booking is still pending before confirming
    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking is not in a pending state" });
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

    // Check if there are enough available slots
    if (tour.bookedSlots + booking.groupSize > tour.groupSize) {
      return res.status(400).json({ message: "Not enough available slots for this booking" });
    }

    // Update bookedSlots in the tour
    tour.bookedSlots += booking.groupSize;
    await tour.save();

    // Confirm the booking
    booking.paymentReference = paymentReference;
    booking.status = status || "CONFIRMED";
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking, updatedTour: tour });
  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).json({ message: "Failed to confirm booking" });
  }
};


export const getTourBookingById = async (req,res) => {
  try {
    const bookingId = req.params.id;

    const booking = await TourBooking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error retrieving booking details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


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
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= tour.images.length) {
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

    res.status(200).json({ message: "Image deleted successfully", images: tour.images });

  } catch (error) {
    console.error("❌ Error deleting tour image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserTourBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    // Find only CONFIRMED and PAID bookings for the user
    const bookings = await TourBooking.find({ 
      email: new RegExp(`^${req.user.email}$`, "i"),
      status: "CONFIRMED",
      paymentStatus: "PAID"
    })
    .populate({
      path: "tour",
      select: "title location images startDate endDate duration price itinerary"
    })
    .sort({ bookingDate: -1 })
    .lean(); // Use lean() to remove Mongoose metadata

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    // Fetch any reviews the user has submitted for these bookings
    const bookingIds = bookings.map(booking => booking._id);

    const reviews = await Review.find({
      bookingId: { $in: bookingIds },
      bookingType: "tour"
    }).lean();

    // Create a map of booking IDs to reviews
    const reviewMap = {};
    reviews.forEach(review => {
      reviewMap[review.bookingId.toString()] = review;
    });

    // Format the response properly
    const formattedBookings = bookings.map(booking => {
      const review = reviewMap[booking._id.toString()] || null;

      return {
        _id: booking._id, 
        status: booking.status,
        bookingDate: booking.bookingDate,
        guestName: booking.guestName,
        email: booking.email,
        phone: booking.phone,
        specialRequests: booking.specialRequests,
        participants: booking.groupSize,
        totalAmount: booking.totalPrice,
        paymentReference: booking.paymentReference,
        
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
        reviewId: review ? review._id : null
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
    const stats = await Stats.findOne();  // Optionally, add filters if you want specific results
    
    if (!stats) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    // Return the stats data
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ message: 'Error retrieving stats' });
  }
};


export const postStats = async (req, res) => {
  try {
    const { destinations, tours, travellers, ratings } = req.body;

    // Check if stats already exist in the database (you can use a unique identifier or just check if there's any stats document)
    const existingStats = await Stats.findOne();  // Optionally, add a filter if you need to look for specific conditions

    if (existingStats) {
      // Update the existing stats document
      existingStats.destinations = destinations;
      existingStats.tours = tours;
      existingStats.travellers = travellers;
      existingStats.ratings = ratings;

      // Save the updated stats to the database
      await existingStats.save();
      res.status(200).json({ message: 'Stats updated successfully' });
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
      res.status(201).json({ message: 'Stats saved successfully' });
    }
  } catch (error) {
    console.error('Error saving or updating stats:', error);
    res.status(500).json({ message: 'Error saving or updating stats' });
  }
};

// Delete a specific stat
export const deleteStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stat = await Stats.findByIdAndDelete(id);

    if (!stat) {
      return res.status(404).json({ message: 'Stat not found' });
    }

    res.status(200).json({ message: 'Stat deleted successfully' });
  } catch (error) {
    console.error('Error deleting stat:', error);
    res.status(500).json({ message: 'Error deleting stat' });
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
      return res.status(404).json({ message: 'Stat not found' });
    }

    res.status(200).json({ message: 'Stat updated successfully', stat });
  } catch (error) {
    console.error('Error updating stat:', error);
    res.status(500).json({ message: 'Error updating stat' });
  }
};

