import express from 'express';
import { initiatePayment, paymentCallback, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

// Initiate payment
router.post('/initiate', initiatePayment);

// Payment callback
router.post('/callback', paymentCallback);

router.post('/verify', verifyPayment);

export default router;
