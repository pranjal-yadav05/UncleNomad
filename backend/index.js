import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

import connectDB from './db.js';
import bookingRoutes from './routes/bookingRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';

import roomRoutes from './routes/roomRoutes.js';
import guidesRoutes from './routes/guidesRoutes.js';
import toursRoutes from './routes/toursRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';



dotenv.config();


// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL;

// Middleware
app.use(cors({
    origin: frontendUrl,
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 30 // 30 minutes
    }
}));


// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/property', propertyRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/api/guides', guidesRoutes);
app.use('/api/tours', toursRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/query',queryRoutes)
app.use('/api/upload', uploadRoutes);

app.use('/api/media',mediaRoutes)

// Error handling middleware

app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.get('/', (req, res) => res.send("Welcome to the API server..."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
