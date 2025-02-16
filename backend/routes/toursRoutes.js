import express from 'express';
import Tour from '../models/Tour.js';

const router = express.Router();

// Get all tours
router.get('/', async (req, res) => {
    try {
        const tours = await Tour.find();
        res.json(tours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
