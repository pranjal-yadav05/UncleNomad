import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import express from 'express';
import Review from '../models/UserReview.js'

const router = express.Router();

// Verify booking details
export const verifyBooking = async (req, res) => {
    try {
      const { rooms, numberOfGuests, checkIn, checkOut } = req.body;
  
      // Validate required fields
      if (!rooms || !numberOfGuests || !checkIn || !checkOut) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Check room availability and capacity
      let totalCapacity = 0;
      const availabilityDetails = [];
  
      for (const roomBooking of rooms) {
        const room = await Room.findById(roomBooking.roomId);
        if (!room) {
          return res.status(404).json({ message: `Room ${roomBooking.roomId} not found` });
        }
  
        // Check availability for selected dates
        const overlappingBookings = await Booking.find({
          'rooms.roomId': room._id,
          $or: [
            { checkIn: { $lt: new Date(checkOut) } },
            { checkOut: { $gt: new Date(checkIn) } }
          ]
        });
  
        // Calculate booked quantity
        const bookedQuantity = overlappingBookings.reduce((sum, booking) => {
          const bookedRoom = booking.rooms.find(r => r.roomId.toString() === room._id.toString());
          return sum + (bookedRoom?.quantity || 0);
        }, 0);
  
        // Check if requested quantity is available
        const availableQuantity = room.totalRooms - bookedQuantity;
        if (roomBooking.quantity > availableQuantity) {
          return res.status(400).json({ 
            message: `Only ${availableQuantity} ${room.type} room(s) available for ${room.name}`
          });
        }
  
        // Calculate capacity for selected rooms
        totalCapacity += room.capacity * roomBooking.quantity;
        availabilityDetails.push({
          roomId: room._id,
          roomName: room.name,
          available: availableQuantity,
          capacity: room.capacity
        });
      }
  
      // Validate guest capacity
      if (numberOfGuests > totalCapacity) {
        return res.status(400).json({ 
          message: `Selected rooms can only accommodate ${totalCapacity} guests`,
          details: availabilityDetails
        });
      }
  
      res.status(200).json({ 
        message: 'Booking details are valid',
        details: availabilityDetails
      });
    } catch (error) {
      console.error('Error verifying booking:', error);
      res.status(500).json({ message: 'Error verifying booking details' });
    }
  };
  

// Check room availability
export const checkAvailabiltiy = async (req, res) => {
    const { checkIn, checkOut } = req.query;
   
    if (!checkIn || !checkOut) {
        return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    try {
        // Get all rooms
        const rooms = await Room.find();
        
        if (!rooms || rooms.length === 0) {
            return res.status(404).json({ message: 'No rooms found in the system' });
        }
       
        // Get all bookings that overlap with the requested dates using a simpler overlap check
        const overlappingBookings = await Booking.find({
            status: "CONFIRMED",
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) }
        }).lean();

        // Calculate availability for each room
        const availableRooms = rooms.map(room => {
            // Get all bookings for this specific room
            const roomBookings = overlappingBookings.flatMap(booking => 
                booking.rooms.filter(r => 
                    r.roomId.toString() === room._id.toString()
                )
            );

            // Calculate booked units
            let bookedUnits = 0;
            if (roomBookings.length > 0) {
                bookedUnits = roomBookings.reduce((sum, booking) => sum + booking.quantity, 0);
            }

            // Calculate availability
            const availability = {
                availableBeds: room.type === 'Dorm' ? Math.max(0, room.capacity - bookedUnits) : null,
                availableRooms: room.type !== 'Dorm' ? Math.max(0, room.totalRooms - bookedUnits) : null,
                totalBeds: room.type === 'Dorm' ? room.capacity : null,
                totalRooms: room.type !== 'Dorm' ? room.totalRooms : null
            };

            // Only include rooms with availability
            if ((room.type === 'Dorm' && availability.availableBeds > 0) ||
                (room.type !== 'Dorm' && availability.availableRooms > 0)) {
                return {
                    ...room.toObject(),
                    availability
                };
            }
            return null;
        }).filter(room => room !== null);
        
        res.json(availableRooms);

    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({ 
            message: 'Error checking room availability',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// CRUD Operations
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate({
                path: 'rooms.roomId',
                select: 'name type price capacity'
            })
            .lean()
            .exec();

        res.json(bookings);
    } catch ( error) {
        console.error('Error in GET /bookings:', error);
        res.status(500).json({ 
            message: 'Failed to fetch bookings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'rooms.roomId',
                select: 'name type price capacity'
            })
            .lean()
            .exec();

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch ( error) {
        console.error('Error in GET /bookings/:id:', error);
        res.status(500).json({ 
            message: 'Failed to fetch booking',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('rooms.roomId');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        res.json(booking);
    } catch ( error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted successfully' });
    } catch ( error) {
        res.status(500).json({ message: error.message });
    }
};

// Book a room
export const createBooking = async (req, res) => {
    const { rooms, checkIn, checkOut, guestName, email, phone, numberOfGuests, specialRequests, totalAmount, paymentReference } = req.body;
  
    try {
        // Validate required fields
        if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
            return res.status(400).json({
                message: "At least one room must be selected for booking",
            });
        }
  
        if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) {
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
            if (!roomBooking.roomId || !roomBooking.quantity || roomBooking.quantity <= 0) {
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
                $or: [{ checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }],
            });
  
            // Calculate total booked units for this room
            const bookedUnits = overlappingBookings.reduce((sum, booking) => {
                const roomBooking = booking.rooms.find((r) => r.roomId.toString() === room._id.toString());
                return sum + (roomBooking?.quantity || 0);
            }, 0);
  
            // Get total capacity based on room type
            const totalCapacityForType = room.type === "Dorm" ? room.capacity : room.totalRooms;
  
            // Calculate available units
            const availableUnits = totalCapacityForType - bookedUnits;
  
            // Validate requested quantity against available units
            if (roomBooking.quantity > availableUnits) {
                return res.status(400).json({
                    message: `Only ${availableUnits} unit(s) of ${room.type} available. You requested ${roomBooking.quantity}.`,
                });
            }
  
            // Calculate number of nights
            const numberOfNights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  
            // Calculate price for this room
            const roomPrice = room.price * roomBooking.quantity * numberOfNights;
            calculatedTotalPrice += roomPrice;
  
            // Create room booking object
            validatedRooms.push({
                roomId: room._id,
                roomType: room.type,
                quantity: roomBooking.quantity,
                price: room.price,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                numberOfNights,
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
            specialRequests,
            totalPrice: calculatedTotalPrice,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentReference: paymentReference || null
        });

        // Save temporary booking to get ID for payment
        const tempBooking = await booking.save();
        
        // Return payment details and temporary booking ID
        res.status(201).json({
            message: "Please proceed to payment",
            booking: booking
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
        const bookings = await Booking.find({ email: new RegExp(`^${req.user.email}$`, "i"), status: "CONFIRMED" })
            .sort({ checkIn: -1 })
            .lean(); // Use lean() for better performance

        if (!bookings.length) {
            return res.status(404).json({ message: "No bookings found for this user" });
        }

        // Extract unique room IDs from bookings
        const roomIds = [...new Set(bookings.flatMap(booking => booking.rooms.map(room => room.roomId)))];
        const bookingIds = bookings.map(booking => booking._id);
        
        // Fetch room details with images
        const rooms = await Room.find({ _id: { $in: roomIds } }, "_id type imageUrls").lean();
        const roomMap = rooms.reduce((acc, room) => {
            acc[room._id.toString()] = room.imageUrls || [];
            return acc;
        }, {});

        const reviews = await Review.find({
            bookingId: { $in: bookingIds },
            bookingType: "room"
        }).lean();

        // Create a map of booking IDs to reviews
        const reviewMap = {};
        reviews.forEach(review => {
            reviewMap[review.bookingId.toString()] = review;
        });

        // Attach images to each booked room
        const enrichedBookings = bookings.map(booking => {
            const review = reviewMap[booking._id.toString()] || null;
            return {
                ...booking,
                rooms: booking.rooms.map(room => ({
                    ...room,
                    images: roomMap[room.roomId.toString()] || []
                })),
                userRating: review ? review.rating : 0,
                userReview: review ? review.comment : "",
                reviewId: review ? review._id : null
            };
        });

        res.json(enrichedBookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

