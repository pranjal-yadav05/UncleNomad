import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import express from "express";
import Review from "../models/UserReview.js";
import ExcelJS from "exceljs";

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
    // Get all rooms
    const rooms = await Room.find();

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
        select: "name type price capacity amenities imageUrls description",
      })
      .lean()
      .exec();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
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

    if (!guestName || !email || !phone || !numberOfGuests) {
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

    // Create temporary booking with PENDING status
    const booking = new Booking({
      rooms: validatedRooms,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guestName,
      email,
      phone,
      numberOfGuests,
      numberOfChildren: numberOfChildren || 0,
      mealIncluded: mealIncluded || false,
      specialRequests,
      totalPrice: calculatedTotalPrice,
      status: "PENDING",
      paymentStatus: "PENDING",
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
    if (!req.user || !req.user.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    // Fetch user bookings
    const bookings = await Booking.find({
      email: new RegExp(`^${req.user.email}$`, "i"),
      status: "CONFIRMED",
    })
      .sort({ checkIn: -1 })
      .lean(); // Use lean() for better performance

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found for this user" });
    }

    // Extract unique room IDs from bookings
    const roomIds = [
      ...new Set(
        bookings.flatMap((booking) => booking.rooms.map((room) => room.roomId))
      ),
    ];
    const bookingIds = bookings.map((booking) => booking._id);

    // Fetch room details with images
    const rooms = await Room.find(
      { _id: { $in: roomIds } },
      "_id type imageUrls"
    ).lean();
    const roomMap = rooms.reduce((acc, room) => {
      acc[room._id.toString()] = room.imageUrls || [];
      return acc;
    }, {});

    const reviews = await Review.find({
      bookingId: { $in: bookingIds },
      bookingType: "room",
    }).lean();

    // Create a map of booking IDs to reviews
    const reviewMap = {};
    reviews.forEach((review) => {
      reviewMap[review.bookingId.toString()] = review;
    });

    // Attach images to each booked room
    const enrichedBookings = bookings.map((booking) => {
      const review = reviewMap[booking._id.toString()] || null;
      return {
        ...booking,
        rooms: booking.rooms.map((room) => ({
          ...room,
          images: roomMap[room.roomId.toString()] || [],
        })),
        userRating: review ? review.rating : 0,
        userReview: review ? review.comment : "",
        reviewId: review ? review._id : null,
      };
    });

    res.json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

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
