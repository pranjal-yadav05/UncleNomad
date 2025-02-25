import Tour from '../models/Tour.js';
import TourBooking from '../models/TourBooking.js';
import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import cloudinary from 'cloudinary'

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
    const { id, title, description, price, duration, groupSize, location, itinerary, startDate, endDate } = req.body;

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
      itinerary: itinerary || [],
      startDate, // New field
      endDate // New field
    });

    res.status(201).json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ message: 'Server error' });
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

export const updateTour = async (req, res) => {
  try {
    const { 
      id, title, description, price, duration, groupSize, location, itinerary, 
      startDate, endDate, image, priceOptions, inclusions, exclusions 
    } = req.body;

    if (!id || !title || !description || !price || !duration || !groupSize || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate itinerary if provided
    if (itinerary && Array.isArray(itinerary)) {
      for (const day of itinerary) {
        if (!day.day || !day.title || !day.description || !day.activities || !day.accommodation) {
          return res.status(400).json({ message: "All itinerary fields are required for each day" });
        }
      }
    }

    // Fetch existing tour details
    const existingTour = await Tour.findById(req.params.id);
    if (!existingTour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    let updatedImage = existingTour.image; // Default to the old image

    // If a new image is uploaded, delete the old one from Cloudinary
    if (image && image !== existingTour.image && existingTour.image) {
      try {
        // Extract the public ID from the existing image URL
        // Example URL: https://res.cloudinary.com/your-cloud-name/image/upload/uncle-nomad/image/UUID.jpg
        const urlPathname = new URL(existingTour.image).pathname;
        const pathParts = urlPathname.split('/');
        
        // Get the filename without extension
        const filenameWithExt = pathParts[pathParts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        
        // Find the folder structure - look for 'uncle-nomad' in the path
        let folderPath = '';
        let foundUncleNomad = false;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (foundUncleNomad || pathParts[i] === 'uncle-nomad') {
            foundUncleNomad = true;
            folderPath += pathParts[i] + '/';
          }
        }
        
        // Construct the proper public ID
        const publicId = folderPath + filename;
        
        console.log(`Deleting old image with publicId: ${publicId}`);
        
        // Delete from Cloudinary
        const deleteResult = await cloudinary.v2.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true
        });
        
        console.log('Cloudinary delete result:', deleteResult);
      } catch (error) {
        console.error("Error deleting old image from Cloudinary:", error);
        // Continue with the update even if the deletion fails
      }

      // Set the new image URL
      updatedImage = image;
    }

    // Update the tour with new details
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
        itinerary: itinerary || [],
        startDate,
        endDate,
        image: updatedImage,
        priceOptions: priceOptions || {},
        inclusions: inclusions || [],
        exclusions: exclusions || []
      },
      { new: true }
    );

    res.json(updatedTour);
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Delete a tour
export const deleteTour = async (req, res) => {
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
    const { orderId } = req.body;
    
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
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentReference, status },
      { new: true }
    );
    
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm booking' });
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
