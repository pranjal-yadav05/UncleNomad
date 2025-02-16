import express from 'express';
import Guide from '../models/Guide.js';

const router = express.Router();

// Get all guides
router.get('/', async (req, res) => {
    try {
        const guides = await Guide.find();
        res.json(guides);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
