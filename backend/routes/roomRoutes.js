import express from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Helper function to check if dates overlap
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

        // Calculate available beds for each room based on existing bookings
        const availableRooms = rooms.map(room => {
            const bookedBeds = overlappingBookings
                .filter(booking => booking.roomId.toString() === room._id.toString())
                .reduce((sum, booking) => {
                    // For dorm rooms, each booking reserves one bed
                    if (room.type === 'Dorm') {
                        return sum + 1;
                    }
                    // For other rooms, use numberOfGuests
                    return sum + (booking.numberOfGuests || 1);
                }, 0);

            const availableBeds = room.capacity - bookedBeds;
            
            return {
                ...room.toObject(),
                availableBeds
            };
        }).filter(room => room.availableBeds > 0);

        res.json(availableRooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get available bunk beds for a dorm room
router.get('/:id/bunk-beds', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room || room.type !== 'Dorm') {
            return res.status(404).json({ message: 'Dorm room not found' });
        }
        const availableBeds = room.getAvailableBunkBeds();
        res.json(availableBeds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
