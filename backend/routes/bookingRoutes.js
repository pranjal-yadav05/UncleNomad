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
    const { 
        roomId,
        quantity = 1,
        checkIn, 
        checkOut, 
        guestName, 
        email, 
        phone,
        numberOfGuests,
        specialRequests 
    } = req.body;
    
    // Validate required fields
    if (!roomId || !checkIn || !checkOut || !guestName || !email || !phone || !numberOfGuests) {
        return res.status(400).json({ 
            message: 'Missing required booking information'
        });
    }

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Get overlapping bookings
        const overlappingBookings = await Booking.find({
            roomId: room._id,
            $or: [
                { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
            ]
        });

        // Validate availability based on room type
        if (room.type === 'Dorm') {
            // For dorms, validate bed availability
            const bookedBeds = overlappingBookings.reduce((sum, booking) => 
                sum + booking.numberOfGuests, 0);
            
            if (bookedBeds + numberOfGuests > room.capacity) {
                return res.status(400).json({ 
                    message: `Only ${room.capacity - bookedBeds} beds available in this dorm`
                });
            }
        } else {
            // For Deluxe and Super Deluxe, validate room availability
            const bookedRooms = overlappingBookings.reduce((sum, booking) => 
                sum + (booking.quantity || 1), 0);
            
            if (bookedRooms + quantity > room.totalRooms) {
                return res.status(400).json({ 
                    message: `Only ${room.totalRooms - bookedRooms} rooms of this type available`
                });
            }

            // Validate total capacity for the rooms being booked
            const totalCapacity = room.capacity * quantity;
            if (numberOfGuests > totalCapacity) {
                return res.status(400).json({ 
                    message: `${quantity} room(s) can only accommodate ${totalCapacity} guests`
                });
            }
        }

        // Calculate price
        const numberOfNights = Math.ceil(
            (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
        );
        const totalPrice = room.price * numberOfNights * (room.type === 'Dorm' ? numberOfGuests : quantity);

        // Create booking
        const booking = new Booking({
            roomId: room._id,
            roomType: room.type,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            numberOfNights,
            totalPrice,
            numberOfGuests,
            quantity,
            guestName,
            email,
            phone,
            specialRequests
        });

        await booking.save();

        res.status(201).json({
            message: 'Booking confirmed successfully',
            booking
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to process booking',
            error: error.message 
        });
    }
});

export default router;