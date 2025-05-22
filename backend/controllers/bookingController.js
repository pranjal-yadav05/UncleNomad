import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Review from "../models/UserReview.js";
import express from "express";
import ExcelJS from "exceljs";
import mongoose from "mongoose";

const router = express.Router();

// Verify booking details
export const verifyBooking = async (req, res) => {
  try {
    const { rooms, numberOfGuests, checkIn, checkOut } = req.body;

    // Validate required fields
    if (!rooms || !numberOfGuests || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check room availability and capacity
    let totalCapacity = 0;
    const availabilityDetails = [];

    for (const roomBooking of rooms) {
      const room = await Room.findById(roomBooking.roomId);
      if (!room) {
        return res
          .status(404)
          .json({ message: `Room ${roomBooking.roomId} not found` });
      }

      // Check availability for selected dates
      const overlappingBookings = await Booking.find({
        "rooms.roomId": room._id,
        $or: [
          { checkIn: { $lt: new Date(checkOut) } },
          { checkOut: { $gt: new Date(checkIn) } },
        ],
      });

      // Calculate booked quantity
      const bookedQuantity = overlappingBookings.reduce((sum, booking) => {
        const bookedRoom = booking.rooms.find(
          (r) => r.roomId.toString() === room._id.toString()
        );
        return sum + (bookedRoom?.quantity || 0);
      }, 0);

      // Check if requested quantity is available
      const availableQuantity = room.totalRooms - bookedQuantity;
      if (roomBooking.quantity > availableQuantity) {
        return res.status(400).json({
          message: `Only ${availableQuantity} ${room.type} room(s) available for ${room.name}`,
        });
      }

      // Calculate capacity for selected rooms
      totalCapacity += room.capacity * roomBooking.quantity;
      availabilityDetails.push({
        roomId: room._id,
        roomName: room.name,
        available: availableQuantity,
        capacity: room.capacity,
      });
    }

    // Validate guest capacity
    if (numberOfGuests > totalCapacity) {
      return res.status(400).json({
        message: `Selected rooms can only accommodate ${totalCapacity} guests`,
        details: availabilityDetails,
      });
    }

    res.status(200).json({
      message: "Booking details are valid",
      details: availabilityDetails,
    });
  } catch (error) {
    console.error("Error verifying booking:", error);
    res.status(500).json({ message: "Error verifying booking details" });
  }
};

// Check room availability
export const checkAvailabiltiy = async (req, res) => {
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res
      .status(400)
      .json({ message: "Check-in and check-out dates are required" });
  }

  try {
    // Get all rooms with reviews populated
    const rooms = await Room.find().populate({
      path: "reviews",
      select: "rating comment userName createdAt",
      match: { status: "approved" },
    });

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: "No rooms found in the system" });
    }

    // Get all bookings that overlap with the requested dates using a simpler overlap check
    const overlappingBookings = await Booking.find({
      status: "CONFIRMED",
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    }).lean();

    // Calculate availability for each room
    const availableRooms = rooms
      .map((room) => {
        // Get all bookings for this specific room
        const roomBookings = overlappingBookings.flatMap((booking) =>
          booking.rooms.filter(
            (r) => r.roomId.toString() === room._id.toString()
          )
        );

        // Calculate booked units
        let bookedUnits = 0;
        if (roomBookings.length > 0) {
          bookedUnits = roomBookings.reduce(
            (sum, booking) => sum + booking.quantity,
            0
          );
        }

        // Calculate availability
        const availability = {
          availableBeds:
            room.type === "Dorm"
              ? Math.max(0, room.capacity - bookedUnits)
              : null,
          availableRooms:
            room.type !== "Dorm"
              ? Math.max(0, room.totalRooms - bookedUnits)
              : null,
          totalBeds: room.type === "Dorm" ? room.capacity : null,
          totalRooms: room.type !== "Dorm" ? room.totalRooms : null,
        };

        // Only include rooms with availability
        if (
          (room.type === "Dorm" && availability.availableBeds > 0) ||
          (room.type !== "Dorm" && availability.availableRooms > 0)
        ) {
          return {
            ...room.toObject(),
            availability,
            reviews: room.reviews || [], // Ensure reviews are included
            averageRating: room.averageRating || 0, // Ensure averageRating is included
          };
        }
        return null;
      })
      .filter((room) => room !== null);

    res.json(availableRooms);
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({
      message: "Error checking room availability",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// CRUD Operations
export const getBookings = async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortParam = req.query.sort || "-createdAt";
    const status = req.query.status;
    const search = req.query.search;

    // Build filter object
    const filter = {};

    // Add status filter if provided
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { guestName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch total count of filtered bookings
    const totalBookings = await Booking.countDocuments(filter);

    // Fetch paginated bookings
    const bookings = await Booking.find(filter)
      .populate({
        path: "rooms.roomId",
        select: "name type price capacity amenities imageUrls description",
      })
      .sort(sortParam)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    res.json({
      bookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: page,
      totalBookings,
    });
  } catch (error) {
    console.error("Error in GET /bookings:", error);
    res.status(500).json({
      message: "Failed to fetch bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "rooms.roomId",
        select:
          "name type price capacity amenities imageUrls description mealIncluded mealPrice beds extraBedPrice smokingAllowed alcoholAllowed childrenAllowed childrenPolicy",
      })
      .lean()
      .exec();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Calculate duration of stay
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const durationInDays = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    // Format payment status to be more user-friendly
    const formattedPaymentStatus = booking.paymentStatus
      ? booking.paymentStatus === "PAID"
        ? "Paid"
        : booking.paymentStatus === "PENDING"
        ? "Pending"
        : booking.paymentStatus === "FAILED"
        ? "Failed"
        : booking.paymentStatus
      : "N/A";

    // Format booking status to be more user-friendly
    const formattedBookingStatus = booking.status
      ? booking.status === "CONFIRMED"
        ? "Confirmed"
        : booking.status === "PENDING"
        ? "Pending"
        : booking.status === "CANCELLED"
        ? "Cancelled"
        : booking.status
      : "N/A";

    // Get user review if exists
    const review = await Review.findOne({
      bookingId: booking._id,
      bookingType: "room",
    }).lean();

    // Enhance booking data with additional information
    const enhancedBooking = {
      ...booking,
      duration: durationInDays,
      status: formattedBookingStatus,
      paymentStatus: formattedPaymentStatus,
      totalAmount: booking.totalPrice, // For consistency with naming in frontend
      location: "Uncle Nomad Stays", // Default location - replace with actual property location if available
      userRating: review ? review.rating : 0,
      userReview: review ? review.comment : "",
      reviewId: review ? review._id : null,
      rooms: booking.rooms.map((room, index) => {
        const roomDetail = room.roomId || {};
        return {
          ...room,
          roomId: room.roomId?._id || room.roomId,
          roomType: room.roomType || roomDetail.type || "Standard Room",
          roomNumber: `Room ${index + 1}`, // Placeholder - could be replaced with actual room numbers if available
          images: roomDetail.imageUrls || [],
          pricePerNight: room.price || roomDetail.price,
          maxOccupancy: room.capacity || roomDetail.capacity || 2,
          amenities: roomDetail.amenities || [],
          bedType: getBedTypeFromRoomType(roomDetail.type),
          mealIncluded: booking.mealIncluded || roomDetail.mealIncluded,
          mealPrice: roomDetail.mealPrice,
          subtotal: room.subtotal || room.price * durationInDays,
          numberOfNights: room.numberOfNights || durationInDays,
        };
      }),
    };

    res.json(enhancedBooking);
  } catch (error) {
    console.error("Error in GET /bookings/:id:", error);
    res.status(500).json({
      message: "Failed to fetch booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    // If rooms are being updated, validate and process room data
    if (req.body.rooms && Array.isArray(req.body.rooms)) {
      const updatedRooms = [];
      let calculatedTotalPrice = 0;

      // Find the existing booking to get dates if not provided
      const existingBooking = await Booking.findById(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const checkIn = req.body.checkIn || existingBooking.checkIn;
      const checkOut = req.body.checkOut || existingBooking.checkOut;

      // Calculate number of nights
      const numberOfNights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
      );

      for (const roomBooking of req.body.rooms) {
        // Skip room if no roomId or quantity is zero/negative
        if (!roomBooking.roomId || roomBooking.quantity <= 0) {
          continue;
        }

        // Get room data
        const room = await Room.findById(
          typeof roomBooking.roomId === "object"
            ? roomBooking.roomId._id
            : roomBooking.roomId
        );

        if (!room) {
          return res.status(400).json({
            message: `Room with ID ${roomBooking.roomId} not found`,
          });
        }

        // Calculate price for this room
        const roomPrice = room.price * roomBooking.quantity * numberOfNights;
        calculatedTotalPrice += roomPrice;

        // Create updated room booking object
        updatedRooms.push({
          roomId: room._id,
          roomName: room.name,
          roomType: room.type,
          quantity: roomBooking.quantity,
          price: room.price,
          capacity: room.capacity,
          numberOfNights,
          subtotal: roomPrice,
        });
      }

      // Update the rooms array and total price
      req.body.rooms = updatedRooms;
      req.body.totalPrice = calculatedTotalPrice;
    }

    // Update the booking
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate({
      path: "rooms.roomId",
      select: "name type price capacity",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Book a room
export const createBooking = async (req, res) => {
  const {
    rooms,
    checkIn,
    checkOut,
    guestName,
    email,
    phone,
    numberOfGuests,
    specialRequests,
    totalAmount,
    paymentReference,
    numberOfChildren,
    mealIncluded,
    status,
    paymentStatus,
  } = req.body;

  try {
    // Validate required fields
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        message: "At least one room must be selected for booking",
      });
    }

    if (
      !checkIn ||
      !checkOut ||
      !isValidDate(checkIn) ||
      !isValidDate(checkOut)
    ) {
      return res.status(400).json({
        message: "Invalid check-in or check-out dates",
      });
    }

    // Make email optional but phone required
    if (!guestName || !phone || !numberOfGuests) {
      return res.status(400).json({
        message: "Missing required guest information",
      });
    }

    // Validate and collect all rooms
    const validatedRooms = [];
    let calculatedTotalPrice = 0;

    for (const roomBooking of rooms) {
      if (
        !roomBooking.roomId ||
        !roomBooking.quantity ||
        roomBooking.quantity <= 0
      ) {
        return res.status(400).json({
          message: "Invalid room booking details",
        });
      }

      const room = await Room.findById(roomBooking.roomId);
      if (!room) {
        return res.status(400).json({
          message: `Room with ID ${roomBooking.roomId} not found`,
        });
      }

      // Check availability for this room type
      const overlappingBookings = await Booking.find({
        status: "CONFIRMED",
        "rooms.roomId": room._id,
        $or: [
          {
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) },
          },
        ],
      });

      // Calculate total booked units for this room
      const bookedUnits = overlappingBookings.reduce((sum, booking) => {
        const roomBooking = booking.rooms.find(
          (r) => r.roomId.toString() === room._id.toString()
        );
        return sum + (roomBooking?.quantity || 0);
      }, 0);

      // Get total capacity based on room type
      const totalCapacityForType =
        room.type === "Dorm" ? room.capacity : room.totalRooms;

      // Calculate available units
      const availableUnits = totalCapacityForType - bookedUnits;

      // Validate requested quantity against available units
      if (roomBooking.quantity > availableUnits) {
        return res.status(400).json({
          message: `Only ${availableUnits} unit(s) of ${room.type} available. You requested ${roomBooking.quantity}.`,
        });
      }

      // Calculate number of nights
      const numberOfNights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
      );

      // Calculate price for this room
      const roomPrice = room.price * roomBooking.quantity * numberOfNights;
      calculatedTotalPrice += roomPrice;

      // Create room booking object with enhanced details
      validatedRooms.push({
        roomId: room._id,
        roomName: room.name,
        roomType: room.type,
        quantity: roomBooking.quantity,
        price: room.price,
        capacity: room.capacity,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        numberOfNights,
        subtotal: roomPrice,
      });
    }

    // Validate total price
    if (Math.abs(calculatedTotalPrice - totalAmount) > 0.01) {
      return res.status(400).json({
        message: "Total price mismatch. Please try again.",
      });
    }

    // Create booking with status from input or default to PENDING
    const booking = new Booking({
      rooms: validatedRooms,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guestName,
      // Include email only if provided
      ...(email && { email }),
      phone,
      numberOfGuests,
      numberOfChildren: numberOfChildren || 0,
      mealIncluded: mealIncluded || false,
      specialRequests,
      totalPrice: calculatedTotalPrice,
      // If paymentReference is provided, set status to CONFIRMED, otherwise use status or default to PENDING
      status: paymentReference ? "CONFIRMED" : status || "PENDING",
      // If paymentReference is provided, set paymentStatus to PAID, otherwise use paymentStatus or default to PENDING
      paymentStatus: paymentReference ? "PAID" : paymentStatus || "PENDING",
      paymentReference: paymentReference || null,
    });

    // Save temporary booking to get ID for payment
    const tempBooking = await booking.save();

    // Return payment details and temporary booking ID
    res.status(201).json({
      message: "Please proceed to payment",
      booking: booking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      message: "Failed to process booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper functions
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

export const getUserBooking = async (req, res) => {
  try {
    console.log("=== getUserBooking Debug Logs ===");
    console.log("1. Request received with user data:", {
      userId: req.user?.id,
      email: req.user?.email,
      phone: req.user?.phone,
      role: req.user?.role,
    });

    if (!req.user) {
      console.log("2. Error: No user data found in request");
      return res.status(400).json({ message: "User data not found in token" });
    }

    // Process phone number at the start if available
    let lastDigits = null;
    if (req.user.phone) {
      const phoneDigits = req.user.phone.replace(/\D/g, "");
      lastDigits = phoneDigits.slice(-10);
      console.log("2.1 Phone number processing:", {
        originalPhone: req.user.phone,
        processedDigits: phoneDigits,
        lastDigits: lastDigits,
      });
    }

    // Create a query based on available user data
    // Base filter - Include both CONFIRMED bookings and bookings with PAID payment status
    let statusFilter = {
      $or: [{ status: "CONFIRMED" }, { paymentStatus: "PAID" }],
    };

    // User identification filter
    let userFilter = {};

    if (req.user.email && !req.user.email.includes("@phone-auth.user")) {
      // For email-authenticated users (excluding phone auth generated emails)
      userFilter.email = new RegExp(`^${req.user.email}$`, "i");
      console.log("3. Searching by email:", userFilter.email);
    } else if (req.user.phone) {
      // Create a more flexible phone number matching pattern
      userFilter.$or = [
        { phone: { $regex: lastDigits + "$" } },
        { phone: { $regex: "^\\+?" + lastDigits + "$" } },
        { phone: { $regex: "^91" + lastDigits + "$" } },
        { phone: { $regex: "^\\+91" + lastDigits + "$" } },
      ];

      console.log("4. Phone number search patterns:", userFilter.$or);
    } else if (req.user.id) {
      console.log("5. Searching by user ID:", req.user.id);
      // Fallback to finding by user ID
      // First find the user to get their email or phone
      const User = mongoose.model("User");
      const user = await User.findById(req.user.id);

      if (!user) {
        console.log("6. Error: User not found by ID");
        return res.status(404).json({ message: "User not found" });
      }

      console.log("7. Found user by ID:", {
        userId: user._id,
        email: user.email,
        phone: user.phone,
      });

      // If user has email, search by email, otherwise search by phone
      if (user.email) {
        userFilter.email = new RegExp(`^${user.email}$`, "i");
        console.log("8. Searching by user ID -> email:", userFilter.email);
      } else if (user.phone) {
        // Process phone for consistent matching
        const phoneDigits = user.phone.replace(/\D/g, "");
        const lastDigits = phoneDigits.slice(-10);
        userFilter.phone = { $regex: lastDigits + "$" };
        console.log("9. Searching by user ID -> phone:", {
          originalPhone: user.phone,
          processedDigits: phoneDigits,
          lastDigits: lastDigits,
          finalRegex: lastDigits + "$",
        });
      } else {
        console.log("10. Error: User has no email or phone");
        return res.status(400).json({ message: "User has no email or phone" });
      }
    } else {
      console.log("11. Error: No identifying information found");
      return res
        .status(400)
        .json({ message: "User has no identifying information" });
    }

    // Combine status and user filters
    const filter = {
      $and: [statusFilter, userFilter],
    };

    console.log("12. Final booking filter:", JSON.stringify(filter, null, 2));
    console.log("12.1 Status filter:", JSON.stringify(statusFilter, null, 2));
    console.log("12.2 User filter:", JSON.stringify(userFilter, null, 2));

    // Fetch user bookings
    const bookings = await Booking.find(filter).sort({ checkIn: -1 }).lean();

    console.log("13. Found bookings count:", bookings.length);

    // Debug - check all bookings in the system
    const allBookings = await Booking.find({}).lean();
    console.log("14. Total bookings in system:", allBookings.length);

    // Print all booking phone numbers to debug
    if (allBookings.length > 0) {
      console.log("15. All booking phone numbers in the system:");
      allBookings.forEach((booking, index) => {
        console.log(
          `Booking ${index + 1}: Phone: ${booking.phone}, Status: ${
            booking.status
          }, Payment Status: ${booking.paymentStatus}`
        );
      });
    }

    // If no bookings found, return an empty array instead of an error
    if (!bookings.length) {
      console.log("16. No bookings found for user, returning empty array");
      return res.json([]);
    }

    // Extract unique room IDs from bookings
    const roomIds = [
      ...new Set(
        bookings.flatMap((booking) => booking.rooms.map((room) => room.roomId))
      ),
    ];
    const bookingIds = bookings.map((booking) => booking._id);

    console.log("17. Processing room and review data:", {
      uniqueRoomIds: roomIds.length,
      bookingIds: bookingIds.length,
    });

    // Fetch detailed room information
    const rooms = await Room.find(
      { _id: { $in: roomIds } },
      "_id name type imageUrls price capacity amenities mealIncluded mealPrice beds extraBedPrice smokingAllowed alcoholAllowed childrenAllowed childrenPolicy"
    ).lean();

    console.log("18. Found rooms count:", rooms.length);

    // Create a detailed room map
    const roomMap = rooms.reduce((acc, room) => {
      acc[room._id.toString()] = {
        roomType: room.type,
        images: room.imageUrls || [],
        pricePerNight: room.price,
        maxOccupancy: room.capacity,
        amenities: room.amenities || [],
        bedType: getBedTypeFromRoomType(room.type),
        mealIncluded: room.mealIncluded,
        mealPrice: room.mealPrice,
        extraBedPrice: room.extraBedPrice,
        policies: {
          smoking: room.smokingAllowed ? "Allowed" : "Not Allowed",
          alcohol: room.alcoholAllowed ? "Allowed" : "Not Allowed",
          children: room.childrenAllowed ? "Allowed" : "Not Allowed",
          childrenPolicy: room.childrenPolicy || "Standard policy applies",
        },
      };
      return acc;
    }, {});

    // Fetch user reviews
    const reviews = await Review.find({
      $or: [
        { bookingId: { $in: bookingIds } },
        ...(lastDigits ? [{ phone: { $regex: lastDigits + "$" } }] : []),
      ],
      bookingType: "room",
    }).lean();

    console.log("19. Found reviews count:", reviews.length);
    console.log("19.1 Review search criteria:", {
      bookingIds: bookingIds,
      phonePattern: lastDigits ? lastDigits + "$" : null,
    });

    // Create a map of booking IDs to reviews
    const reviewMap = {};
    reviews.forEach((review) => {
      if (review.bookingId) {
        reviewMap[review.bookingId.toString()] = review;
      }
    });

    // Calculate duration for each booking
    const enrichedBookings = bookings.map((booking) => {
      const review = reviewMap[booking._id.toString()] || null;
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      const durationInDays = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );

      // Format payment status to be more user-friendly
      const formattedPaymentStatus = booking.paymentStatus
        ? booking.paymentStatus === "PAID"
          ? "Paid"
          : booking.paymentStatus === "PENDING"
          ? "Pending"
          : booking.paymentStatus === "FAILED"
          ? "Failed"
          : booking.paymentStatus
        : "N/A";

      // Format booking status to be more user-friendly
      const formattedBookingStatus = booking.status
        ? booking.status === "CONFIRMED"
          ? "Confirmed"
          : booking.status === "PENDING"
          ? "Pending"
          : booking.status === "CANCELLED"
          ? "Cancelled"
          : booking.status
        : "N/A";

      // Check if review exists for this booking's phone number
      const phoneReview = reviews.find(
        (r) =>
          r.phone &&
          r.phone.replace(/\D/g, "").slice(-10) ===
            booking.phone.replace(/\D/g, "").slice(-10)
      );

      return {
        ...booking,
        duration: durationInDays,
        status: formattedBookingStatus,
        paymentStatus: formattedPaymentStatus,
        totalAmount: booking.totalPrice,
        rooms: booking.rooms.map((room, index) => {
          const roomDetails = roomMap[room.roomId.toString()] || {};
          return {
            ...room,
            roomId: room.roomId,
            roomType: room.roomType || roomDetails.roomType || "Standard Room",
            roomNumber: `Room ${index + 1}`,
            images: roomDetails.images || [],
            pricePerNight: room.price || roomDetails.pricePerNight,
            maxOccupancy: room.capacity || roomDetails.maxOccupancy || 2,
            amenities: roomDetails.amenities,
            bedType: roomDetails.bedType,
            mealIncluded: booking.mealIncluded || roomDetails.mealIncluded,
            mealPrice: roomDetails.mealPrice,
            subtotal: room.subtotal,
            numberOfNights: room.numberOfNights || durationInDays,
          };
        }),
        userRating: review || phoneReview ? (review || phoneReview).rating : 0,
        userReview:
          review || phoneReview ? (review || phoneReview).comment : "",
        reviewId: review || phoneReview ? (review || phoneReview)._id : null,
        location: "Uncle Nomad Stays",
      };
    });

    console.log("20. Successfully processed and enriched bookings");
    res.json(enrichedBookings);
  } catch (error) {
    console.error("Error in getUserBooking:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Helper function to determine bed type based on room type
function getBedTypeFromRoomType(type) {
  if (!type) return "Standard";

  type = type.toLowerCase();
  if (type.includes("king")) return "King Size";
  if (type.includes("queen")) return "Queen Size";
  if (type.includes("single")) return "Single";
  if (type.includes("twin")) return "Twin";
  if (type.includes("double")) return "Double";
  if (type.includes("family")) return "Family";
  if (type.includes("suite")) return "Suite";
  if (type.includes("dorm") || type.includes("dormitory")) return "Bunk Bed";

  return "Standard";
}

// Update the format function inside exportBookingsToExcel
const formatDateDDMMYYYY = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Helper function to generate Excel file for bookings
async function generateBookingsExcel(bookings) {
  // Create a new Excel workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bookings");

  // Define columns
  worksheet.columns = [
    { header: "Booking ID", key: "id", width: 30 },
    { header: "Guest Name", key: "guestName", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Check-in", key: "checkIn", width: 15 },
    { header: "Check-out", key: "checkOut", width: 15 },
    { header: "Rooms", key: "rooms", width: 30 },
    { header: "Room Details", key: "roomDetails", width: 40 },
    { header: "Number of Guests", key: "numberOfGuests", width: 15 },
    { header: "Number of Children", key: "numberOfChildren", width: 15 },
    { header: "Meal Included", key: "mealIncluded", width: 15 },
    { header: "Total Price", key: "totalPrice", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Payment Status", key: "paymentStatus", width: 15 },
    { header: "Special Requests", key: "specialRequests", width: 30 },
    { header: "Created At", key: "createdAt", width: 15 },
  ];

  // Format header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data to worksheet
  bookings.forEach((booking) => {
    // Format room information - simpler version using stored room name and type
    const roomsInfo = booking.rooms
      .map((room) => {
        // Prefer the stored room name and type if available
        const roomName =
          room.roomName ||
          (room.roomId &&
            (typeof room.roomId === "object"
              ? room.roomId.name
              : "Unknown Room")) ||
          "Unknown Room";
        const roomType =
          room.roomType ||
          (room.roomId &&
            (typeof room.roomId === "object"
              ? room.roomId.type
              : "Unknown Type")) ||
          "Unknown Type";

        return `${roomName} (${roomType}) x ${room.quantity}`;
      })
      .join(", ");

    // More detailed room information
    const roomDetails = booking.rooms
      .map((room) => {
        const roomName =
          room.roomName ||
          (room.roomId &&
            (typeof room.roomId === "object"
              ? room.roomId.name
              : "Unknown Room")) ||
          "Unknown Room";
        const roomType =
          room.roomType ||
          (room.roomId &&
            (typeof room.roomId === "object"
              ? room.roomId.type
              : "Unknown Type")) ||
          "Unknown Type";
        const price =
          room.price ||
          (room.roomId &&
            (typeof room.roomId === "object" ? room.roomId.price : 0)) ||
          0;
        const nights = room.numberOfNights || 0;
        const subtotal = room.subtotal || price * room.quantity * nights;

        return `${roomName} (${roomType}): ${room.quantity} x ₹${price} x ${nights} nights = ₹${subtotal}`;
      })
      .join("; ");

    // Format dates
    const createdAtDate = new Date(booking.createdAt);

    // Add row
    worksheet.addRow({
      id: booking._id.toString(),
      guestName: booking.guestName,
      email: booking.email,
      phone: booking.phone,
      checkIn: formatDateDDMMYYYY(booking.checkIn),
      checkOut: formatDateDDMMYYYY(booking.checkOut),
      rooms: roomsInfo,
      roomDetails: roomDetails,
      numberOfGuests: booking.numberOfGuests,
      numberOfChildren: booking.numberOfChildren || 0,
      mealIncluded: booking.mealIncluded ? "Yes" : "No",
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus || "PENDING",
      specialRequests: booking.specialRequests || "None",
      createdAt: formatDateDDMMYYYY(booking.createdAt),
    });
  });

  // Create a buffer to store the workbook
  return await workbook.xlsx.writeBuffer();
}

export const exportBookingsToExcel = async (req, res) => {
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

    // Query bookings within the date range
    const bookings = await Booking.find({
      checkIn: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "rooms.roomId",
        select: "name type price capacity amenities description",
      })
      .sort({ checkIn: 1 })
      .lean();

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found in the specified date range" });
    }

    // Generate Excel file
    const buffer = await generateBookingsExcel(bookings);

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bookings_${fromDate}_to_${toDate}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting bookings to Excel:", error);
    res.status(500).json({
      message: "Failed to export bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Export all bookings with filters
export const exportAllBookings = async (req, res) => {
  try {
    // Extract filter parameters
    const sortParam = req.query.sort || "-createdAt";
    const status = req.query.status;
    const search = req.query.search;

    // Build filter object
    const filter = {};

    // Add status filter if provided
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { guestName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch all bookings with filters
    const bookings = await Booking.find(filter)
      .populate({
        path: "rooms.roomId",
        select: "name type price capacity amenities description",
      })
      .sort(sortParam)
      .lean();

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found with the specified filters" });
    }

    // Generate Excel file
    const buffer = await generateBookingsExcel(bookings);

    // Get current date for filename
    const today = new Date().toISOString().split("T")[0];

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=all_bookings_${today}.xlsx`
    );

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting all bookings to Excel:", error);
    res.status(500).json({
      message: "Failed to export bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const generateBookingReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid booking ID format",
      });
    }

    // Fetch the booking with populated details
    const booking = await Booking.findById(id)
      .populate("rooms.roomId")
      .populate({
        path: "tour",
        select: "name duration location price images",
      })
      .exec();

    if (!booking) {
      return res.status(404).json({
        status: "ERROR",
        message: "Booking not found",
      });
    }

    // Check if user is authorized to access this receipt
    if (
      req.user._id.toString() !== booking.userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "ERROR",
        message: "You are not authorized to access this receipt",
      });
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: `RCPT-${booking._id.toString().slice(-6)}-${Date.now()
        .toString()
        .slice(-4)}`,
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
        email: booking.email,
        phone: booking.phone,
      },
      bookingDetails: booking.rooms
        ? {
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            rooms: booking.rooms.map((room) => ({
              name: room.roomName,
              quantity: room.quantity,
              nights: room.numberOfNights,
              pricePerNight: room.price,
              subtotal: room.subtotal,
            })),
            totalAmount: booking.totalPrice,
          }
        : {
            tourName: booking.tourName,
            tourDate: booking.tourDate,
            tourEndDate: booking.tourEndDate,
            participants: booking.participants,
            duration: booking.duration,
            pricePerPerson: booking.pricePerPerson,
            totalAmount: booking.totalAmount,
          },
      paymentDetails: {
        method: booking.paymentMethod || "Online Payment",
        reference: booking.paymentReference,
        amount:
          booking.paymentAmount || booking.totalAmount || booking.totalPrice,
        date: booking.paymentDate,
      },
      issueDate: new Date(),
      companyDetails: {
        name: "Uncle Nomad",
        address: "123 Retreat Lane, Tourism Valley, India",
        phone: "+91 9876543210",
        email: "bookings@unclenomad.com",
        website: "www.unclenomad.com",
        gst: "GST12345678AB",
      },
    };

    return res.status(200).json({
      status: "SUCCESS",
      data: receiptData,
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to generate receipt",
      error: error.message,
    });
  }
};
