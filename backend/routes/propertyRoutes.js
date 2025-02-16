import express from 'express';
import Property from '../models/Property.js';

const router = express.Router();

// Get property details
router.get('/', async (req, res) => {
    try {
        const property = await Property.findOne();
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
