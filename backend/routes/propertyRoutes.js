import express from 'express';
const router = express.Router();
import { getProperty, updateProperty } from '../controllers/propertyController.js';

// Get property details
router.get('/', getProperty);

// Update property details
router.put('/', updateProperty);

export default router;
