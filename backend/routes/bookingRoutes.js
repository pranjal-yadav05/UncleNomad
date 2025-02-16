import express from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Helper function to check date overlap
const datesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
};

// Check room availability
router.get('/availability', async (req, res) => {
    const { checkIn, checkOut } = req.query;
   
    if (!checkIn || !checkOut) {
        return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    try {
        // Get all rooms
        const rooms = await Room.find();
       
        // Get all bookings that overlap with the requested dates
        const overlappingBookings = await Booking.find({
            $or: [
                { checkIn: { $lte: new Date(checkOut) }, checkOut: { $gte: new Date(checkIn) } }
            ]
        });

        // Calculate availability for each room type
        const availableRooms = rooms.map(room => {
            const roomBookings = overlappingBookings.filter(
                booking => booking.roomId.toString() === room._id.toString()
            );

            let availability;
            if (room.type === 'Dorm') {
                // For dorm, count total booked beds
                const bookedBeds = roomBookings.reduce((sum, booking) => 
                    sum + booking.numberOfGuests, 0);
                availability = {
                    availableBeds: Math.max(0, room.capacity - bookedBeds),
                    totalBeds: room.capacity
                };
            } else {
                // For Deluxe and Super Deluxe, count booked rooms
                const bookedRooms = roomBookings.reduce((sum, booking) => 
                    sum + (booking.quantity || 1), 0);
                availability = {
                    availableRooms: Math.max(0, room.totalRooms - bookedRooms),
                    totalRooms: room.totalRooms
                };
            }

            return {
                ...room.toObject(),
                availability
            };
        });

        res.json(availableRooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Book a room
router.post('/book', async (req, res) => {
    const { rooms, checkIn, checkOut, guestName, email, phone, numberOfGuests, specialRequests } = req.body;

    console.log('Received booking request:', req.body);

    // Enhanced input validation
    try {
        // Validate required fields and their types
        if (!numberOfGuests || typeof numberOfGuests !== 'number' || numberOfGuests <= 0) {
            return res.status(400).json({ 
                message: 'Invalid number of guests. Please provide a positive number.' 
            });
        }

        if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
            return res.status(400).json({ 
                message: 'At least one room must be selected for booking' 
            });
        }

        if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) {
            return res.status(400).json({ 
                message: 'Invalid check-in or check-out dates' 
            });
        }

        if (!guestName || typeof guestName !== 'string' || guestName.trim().length === 0) {
            return res.status(400).json({ 
                message: 'Guest name is required' 
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                message: 'Invalid email address' 
            });
        }

        if (!isValidPhone(phone)) {
            return res.status(400).json({ 
                message: 'Invalid phone number' 
            });
        }

        const bookings = [];
        let totalPrice = 0;
        let totalCapacity = 0;

        // Validate and collect all rooms
        const validatedRooms = [];
        for (const roomBooking of rooms) {
            if (!roomBooking.roomId || !roomBooking.quantity || roomBooking.quantity <= 0) {
                throw new Error('Invalid room booking details');
            }

            const room = await Room.findById(roomBooking.roomId);
            if (!room) {
                throw new Error(`Room with ID ${roomBooking.roomId} not found`);
            }

            const overlappingBookings = await Booking.find({
                roomId: room._id,
                $or: [
                    { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
                ]
            });

            if (room.type === 'Dorm') {
                const bookedBeds = overlappingBookings.reduce((sum, booking) => 
                    sum + (booking.quantity || 1), 0);
                
                if (bookedBeds + roomBooking.quantity > room.capacity) {
                    throw new Error(`Only ${room.capacity - bookedBeds} bed(s) available in dorm. You requested ${roomBooking.quantity} beds.`);
                }
                totalCapacity += roomBooking.quantity;
            } else {
                const bookedRooms = overlappingBookings.reduce((sum, booking) => 
                    sum + (booking.quantity || 1), 0);
                
                if (bookedRooms + roomBooking.quantity > room.totalRooms) {
                    throw new Error(`Only ${room.totalRooms - bookedRooms} room(s) of type ${room.type} available. You requested ${roomBooking.quantity} rooms.`);
                }
                totalCapacity += room.capacity * roomBooking.quantity;
            }

            validatedRooms.push({ room, quantity: roomBooking.quantity });
        }

        // Validate total capacity
        if (numberOfGuests > totalCapacity) {
            throw new Error(`Selected rooms can only accommodate ${totalCapacity} guests. You requested for ${numberOfGuests} guests.`);
        }

        // Process bookings for validated rooms
        for (const { room, quantity } of validatedRooms) {
            const numberOfNights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
            const roomTotalPrice = room.price * numberOfNights * quantity;
            totalPrice += roomTotalPrice;

            bookings.push({
                roomId: room._id,
                roomType: room.type,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                numberOfNights,
                totalPrice: roomTotalPrice,
                quantity,
                guestName,
                email,
                phone,
                numberOfGuests, // Added this field
                specialRequests
            });
        }

        const savedBookings = await Booking.insertMany(bookings);

        return res.status(201).json({ 
            message: 'Booking confirmed successfully',
            booking: {
                checkIn,
                checkOut,
                totalPrice,
                numberOfGuests,
                rooms: savedBookings.map(booking => ({
                    roomId: booking.roomId,
                    roomType: booking.roomType,
                    quantity: booking.quantity,
                    pricePerNight: booking.totalPrice / booking.numberOfNights
                }))
            }
        });
    } catch (error) {
        console.error('Booking error:', error);
        return res.status(500).json({ 
            message: error.message || 'Failed to process booking',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Helper functions for validation
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Modify this regex based on your phone number format requirements
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
}

export default router;