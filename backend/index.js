import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config()

const app = express();
const PORT = 5000;

const frontendUrl = process.env.FRONTEND_URL;
// Middleware
app.use(cors({
    origin: frontendUrl
}));
app.use(json());

// Property Details
const manaliProperty = {
    id: 1,
    title: "Uncle Nomad Manali",
    location: "Manali, Himachal Pradesh",
    description: "Experience luxury in the heart of Manali with breathtaking mountain views",
    image: "manali.png",
    rating: "4.8",
    amenities: ["Mountain View", "Breakfast", "WiFi", "Room Service", "Parking"],
    rooms: [
        {
            id: 1,
            type: "Deluxe Mountain View",
            price: 2999,
            capacity: 2,
            amenities: ["King Bed", "Mountain View", "Private Balcony"]
        },
        {
            id: 2,
            type: "Premium Suite",
            price: 4999,
            capacity: 4,
            amenities: ["2 Queen Beds", "Living Room", "Jacuzzi"]
        },
        {
            id: 3,
            type: "Family Room",
            price: 3999,
            capacity: 3,
            amenities: ["1 King Bed + 1 Single Bed", "Garden View", "Mini Kitchen"]
        }
    ]
};

// Bookings data (in-memory storage)
let bookings = [];

const tours = [
    {
        id: 1,
        title: "Manali Adventure Package",
        description: "5-day adventure including hiking, camping, and local experiences",
        price: "12999",
        duration: "5 Days",
        groupSize: "6-8 people",
        image: "manali_package.jpeg",
        location: "Manali"
    },
    {
        id: 2,
        title: "Kasol Backpacking Trip",
        description: "3-day backpacking experience in the serene Parvati Valley with riverside camping and local cafe hopping",
        price: "8999",
        duration: "3 Days",
        groupSize: "5-7 people",
        image: "kasol_package.jpg",
        location: "Kasol"
    },
    {
        id: 3,
        title: "Rishikesh Adventure Retreat",
        description: "4-day adventure retreat including river rafting, yoga, and camping by the Ganges",
        price: "10999",
        duration: "4 Days",
        groupSize: "6-10 people",
        image: "rishikesh.jpg",
        location: "Rishikesh"
    }
];

const guides = [
    {
        id: 1,
        name: "Rahul Sharma",
        speciality: "Trekking Expert",
        experience: "5+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi"]
    },
    {
        id: 2,
        name: "Priya Singh",
        speciality: "Cultural Guide",
        experience: "4+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "French"]
    },
    {
        id: 3,
        name: "Amit Mehta",
        speciality: "Adventure Sports Instructor",
        experience: "6+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi"]
    },
    {
        id: 4,
        name: "Neha Verma",
        speciality: "Yoga & Wellness Guide",
        experience: "8+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "Sanskrit"]
    },
    {
        id: 5,
        name: "Vikram Thakur",
        speciality: "Wildlife & Nature Expert",
        experience: "7+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "Punjabi"]
    }
];

// Helper function to check if dates overlap
const datesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
};

// API Routes
app.get('/api/property', (req, res) => {
    res.json(manaliProperty);
});

// Check room availability
app.get('/api/rooms/availability', (req, res) => {
    const { checkIn, checkOut } = req.query;
    
    if (!checkIn || !checkOut) {
        return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    // Get all rooms that aren't booked for the requested dates
    const availableRooms = manaliProperty.rooms.filter(room => {
        const roomBookings = bookings.filter(booking => booking.roomId === room.id);
        return !roomBookings.some(booking => 
            datesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)
        );
    });

    res.json(availableRooms);
});

// Book a room
app.post('/api/rooms/book', (req, res) => {
    const { 
        roomId, 
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
            message: 'Missing required booking information',
            required: ['roomId', 'checkIn', 'checkOut', 'guestName', 'email', 'phone', 'numberOfGuests']
        });
    }

    // Check if room exists
    const room = manaliProperty.rooms.find(r => r.id === roomId);
    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // Check if number of guests exceeds room capacity
    if (numberOfGuests > room.capacity) {
        return res.status(400).json({ 
            message: `Number of guests exceeds room capacity of ${room.capacity}` 
        });
    }

    // Check if room is available for the dates
    const isAvailable = !bookings.some(booking => 
        booking.roomId === roomId && 
        datesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)
    );

    if (!isAvailable) {
        return res.status(400).json({ message: 'Room not available for selected dates' });
    }

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numberOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * numberOfNights;

    // Create booking
    const booking = {
        id: bookings.length + 1,
        roomId,
        roomType: room.type,
        checkIn,
        checkOut,
        numberOfNights,
        totalPrice,
        guestName,
        email,
        phone,
        numberOfGuests,
        specialRequests,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);

    // Return booking confirmation
    res.status(201).json({
        message: 'Booking confirmed successfully',
        booking
    });
});

// Get booking details
app.get('/api/bookings/:id', (req, res) => {
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
});

app.get('/api/tours', (req, res) => {
    res.json(tours);
});

app.get('/api/guides', (req, res) => {
    res.json(guides);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});