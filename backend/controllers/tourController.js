import Tour from '../models/Tour.js';
import TourBooking from '../models/TourBooking.js';
import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import streamifier from 'streamifier';
import { v2 as cloudinaryV2 } from 'cloudinary';
import mongoose from 'mongoose';

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
    console.log(`Starting upload to Cloudinary: ${publicId}`);
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
            console.log(`Cloudinary upload success: ${result.secure_url}`);
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
    const tours = await Tour.find();
    res.json(tours);
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTour = async (req, res) => {
  try {
    const { title, description, price, duration, groupSize, location, itinerary, startDate, endDate } = req.body;
    
    // Create tour first with empty images array
    const newTour = new Tour({
      title, 
      description, 
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
    console.log(`Tour created with ID: ${newTour._id}`);
    
    // Upload images if available
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} image uploads for tour ${newTour._id}`);
      
      // Upload each image and collect URLs
      const uploadPromises = req.files.map((file, index) => 
        uploadToCloudinary(file, newTour._id, index)
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);
      console.log(`Successfully uploaded ${validUrls.length} images`);
      
      // Update tour with image URLs - use findByIdAndUpdate for reliability
      const updatedTour = await Tour.findByIdAndUpdate(
        newTour._id,
        { $set: { images: validUrls } },
        { new: true }
      );
      
      console.log(`Tour updated with ${updatedTour.images.length} images`);
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
    res.json(tour);
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a tour
export const updateTour = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n➡️ Received update request for tour ID: ${id}`);
    console.log("➡️ Request body:", req.body);

    // Check if the tour exists
    const existingTour = await Tour.findById(id);
    if (!existingTour) {
      console.error("❌ Tour not found");
      return res.status(404).json({ message: "Tour not found" });
    }
    console.log("✅ Existing tour found");

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

    console.log("🛠️ Preparing to update tour data...");

    // Check if images were uploaded
    if (req.files && req.files.length > 0) {
      console.log(`🖼️ Received ${req.files.length} files for upload`);

      // Log received files
      req.files.forEach((file, index) => {
        console.log(`📂 File ${index + 1}:`, {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });
      });

      // Delete old images from Cloudinary
      console.log("🗑️ Deleting old images from Cloudinary...");
      const deletePromises = existingTour.images.map(async (url) => {
        try {
          const result = await deleteCloudinaryImage(url);
          console.log(`✅ Deleted: ${url}`);
          return result;
        } catch (error) {
          console.error(`❌ Failed to delete ${url}:`, error);
        }
      });
      await Promise.all(deletePromises);

      // Upload new images
      console.log("🚀 Uploading new images to Cloudinary...");
      const uploadPromises = req.files.map((file, index) =>
        uploadToCloudinary(file, id, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null);

      console.log(`✅ Successfully uploaded ${validUrls.length} images`);
      updateData.images = validUrls;
    } else {
      console.log("⚠️ No new images uploaded, keeping existing ones");
    }

    // Update the tour in MongoDB
    console.log("🛠️ Updating tour in MongoDB...");
    const updatedTour = await Tour.findByIdAndUpdate(id, updateData, { new: true });

    console.log("✅ MongoDB update result:", updatedTour);
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
  console.log('called init')
  try {
    const { tourId, bookingId, amount, email, phone, guestName, groupSize, specialRequests } = req.body;
    const totalAmount = amount;

    console.log(req.body)
    // Validate required fields
    if (!tourId || !bookingId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the existing booking instead of creating a new one
    const booking = await TourBooking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status !== 'PENDING' || booking.paymentStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Booking is not in PENDING state' });
    }

    // Validate that amount matches the booking's totalPrice
    if (Math.abs(booking.totalPrice - totalAmount) > 0.01) {
      return res.status(400).json({ message: 'Amount mismatch with booking total price' });
    }
    
    // Validate Paytm configuration
    const config = validatePaytmConfig()

    // Generate a unique order ID using booking ID
    const orderId = `TOUR_ORDER_${Date.now()}_${booking._id}`

    // Prepare parameters for Paytm
    const paytmParams = {
      body: {
        requestType: "Payment",
        mid: config.PAYTM_MID,
        websiteName: config.PAYTM_WEBSITE,
        orderId: orderId,
        callbackUrl: config.PAYTM_CALLBACK_URL,
        txnAmount: {
          value: booking.totalPrice.toString(),
          currency: "INR",
        },
        userInfo: {
          custId: booking.email,
        },
      },
    }

    // Generate checksum
    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), config.PAYTM_MERCHANT_KEY)

    paytmParams.head = {
      signature: checksum,
    }

    // Make API call to Paytm
    const response = await new Promise((resolve, reject) => {
      const post_data = JSON.stringify(paytmParams)
      const options = {
        hostname: process.env.PAYTM_HOSTNAME,
        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${config.PAYTM_MID}&orderId=${orderId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      }

      const req = https.request(options, (response) => {
        let data = ""
        response.on("data", (chunk) => {
          data += chunk
        })
        response.on("end", () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(new Error("Failed to parse payment gateway response"))
          }
        })
      })

      req.on("error", (error) => {
        reject(new Error(`Payment gateway connection error: ${error.message}`))
      })

      req.write(post_data)
      req.end()
    })

    // Update booking with payment initiation details
    await TourBooking.findByIdAndUpdate(booking._id, {
      paymentReference: orderId,
      paymentStatus: 'INITIATED'
    });

    // Store booking ID in session for callback (though not needed anymore with our DB-based approach)
    req.session.tempBooking = {
      bookingId: booking._id,
      orderId: orderId
    };

    res.json({
      status: "SUCCESS",
      data: {
        orderId: orderId,
        txnToken: response.body.txnToken,
        amount: booking.totalPrice,
        callbackUrl: config.PAYTM_CALLBACK_URL,
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

// Verify tour payment
export const verifyTourPayment = async (req, res) => {
  try {
    const { orderId, tourId } = req.body;
    
    // Find booking in database by payment reference instead of using session
    const booking = await TourBooking.findOne({ 
      paymentReference: orderId,
      status: "PENDING",
      paymentStatus: "INITIATED"
    });

    if (!booking) {
      return res.status(400).json({ message: 'Invalid booking reference or booking not found' });
    }
    
    // Validate Paytm configuration
    const config = validatePaytmConfig();
    
    // Prepare parameters for status check
    const paytmParams = {
      body: {
        mid: config.PAYTM_MID,
        orderId: orderId,
      },
    };
    
    // Generate checksum
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      config.PAYTM_MERCHANT_KEY
    );
    
    paytmParams.head = {
      signature: checksum,
    };
    
    // Make API call to Paytm
    const response = await new Promise((resolve, reject) => {
      const post_data = JSON.stringify(paytmParams);
      const options = {
        hostname: process.env.PAYTM_HOSTNAME,
        port: 443,
        path: `/v3/order/status`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };
      
      const req = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        
        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse payment gateway response"));
          }
        });
      });
      
      req.on("error", (error) => {
        reject(new Error(`Payment gateway connection error: ${error.message}`));
      });
      
      req.write(post_data);
      req.end();
    });
    
    // Process the response
    if (response.body.resultInfo.resultStatus === "TXN_SUCCESS") {
      // Update booking status directly (no need to find it again since we already have it)
      const session = await mongoose.startSession();
      session.startTransaction();

      const updatedBooking = await TourBooking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentDate: new Date(),
          paymentAmount: response.body.txnAmount,
          paymentReference: response.body.txnId,
        },
        { new: true }
      );

      
      if (!updatedBooking) {
        return res.status(404).json({
          status: "ERROR",
          message: "Booking not found during update",
        });
      }

      const updatedTour = await Tour.findByIdAndUpdate(
        tourId,
        { $inc: { bookedSlots: updatedBooking.groupSize } }, // Increase booked slots
        { new: true, session }
      );

      if (!updatedTour) {
        throw new Error("Tour not found while updating bookedSlots");
      }

      await session.commitTransaction();
      session.endSession();

      
      return res.json({
        status: "SUCCESS",
        message: "Payment verified successfully",
        data: {
          orderId: orderId,
          txnId: response.body.txnId,
          txnAmount: response.body.txnAmount,
          status: response.body.resultInfo.resultStatus,
          bankTxnId: response.body.bankTxnId,
          bookingId: updatedBooking._id
        },
      });
    } else {
      // Update booking status as failed
      await TourBooking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: "FAILED",
          status: "PAYMENT_FAILED",
          paymentError: response.body.resultInfo.resultMsg,
          paymentErrorCode: response.body.resultInfo.resultCode,
        }
      );
      
      return res.status(400).json({
        status: "ERROR",
        message: response.body.resultInfo.resultMsg || "Payment verification failed",
        data: {
          orderId: orderId,
          statusCode: response.body.resultInfo.resultCode,
          statusMessage: response.body.resultInfo.resultMsg,
          bookingId: booking._id
        },
      });
    }
  } catch (error) {
    console.error("Error verifying tour payment:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to verify payment",
    });
  }
};

// Validate Paytm configuration
const validatePaytmConfig = () => {
  const requiredConfig = {
    PAYTM_MID: process.env.PAYTM_MID,
    PAYTM_MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY,
    PAYTM_WEBSITE: process.env.PAYTM_WEBSITE,
    PAYTM_CALLBACK_URL: process.env.PAYTM_CALLBACK_URL
  };

  const missingConfig = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(', ')}`);
  }

  return requiredConfig;
};

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
    console.log('inside confirm')
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
    console.log('tour',tour)
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

    console.log(`🗑️ Request to delete image at index ${imageIndex} for tour ${tourId}`);

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
      console.log(`🗑️ Deleting from Cloudinary: ${imageUrl}`);
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

    console.log("✅ Image deleted successfully");
    res.status(200).json({ message: "Image deleted successfully", images: tour.images });

  } catch (error) {
    console.error("❌ Error deleting tour image:", error);
    res.status(500).json({ message: "Server error" });
  }
};