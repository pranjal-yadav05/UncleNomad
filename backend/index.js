import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import bookingRoutes from './routes/bookingRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import guidesRoutes from './routes/guidesRoutes.js';
import toursRoutes from './routes/toursRoutes.js';


dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL;

// Middleware
app.use(cors({
    origin: frontendUrl
}));
app.use(express.json());

// Routes
// app.use('/api/rooms', roomRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/rooms', bookingRoutes); // Changed to match frontend expectation
app.use('/api/guides', guidesRoutes);
app.use('/api/tours', toursRoutes);



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.get('/', (req, res) => res.send("Welcome to the API server..."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
