import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import { Router } from 'express';
import Booking from '../models/Booking.js';
import Razorpay from "razorpay"
import crypto from "crypto"

const router = Router();

export const initiatePayment = async (req, res) => {
    try {
      const { bookingData, amount, email, phone } = req.body
  
      // Validate required fields
      if (!bookingData || !amount || !email || !phone) {
        return res.status(400).json({
          status: "ERROR",
          message: "Missing required fields for payment initiation",
        })
      }
  
      // Validate configuration
      const config = validateRazorpayConfig()
  
      // Validate amount format
      const numericAmount = Number.parseFloat(bookingData.totalAmount)
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          status: "ERROR",
          message: "Invalid amount value",
        })
      }
  
      // Initialize Razorpay instance
      const razorpay = new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET,
      })
  
      // Format receipt ID with timestamp to ensure uniqueness
      const timestamp = new Date().getTime()
      const receiptId = `RECEIPT_${timestamp}_${email.split("@")[0].substring(0, 6)}`
  
      // Create Razorpay order
      const orderOptions = {
        amount: Math.round(numericAmount * 100), // Razorpay expects amount in paise
        currency: "INR",
        receipt: receiptId,
        notes: {
          email: email.substring(0, 50),
          phone: phone.toString().replace(/\D/g, "").substring(0, 15),
        },
      }
  
      const order = await razorpay.orders.create(orderOptions)
  
      // Store temporary booking reference in session
      const tempBooking = {
        ...bookingData,
        paymentStatus: "INITIATED",
        paymentInitiatedAt: new Date(),
        paymentReference: order.id,
        status: "PENDING",
      }
  
      if (req.session) {
        req.session.tempBooking = tempBooking
      } else {
        console.warn("Session not available for storing booking data")
      }
  
      return res.json({
        status: "SUCCESS",
        data: {
          key: config.RAZORPAY_KEY_ID,
          orderId: order.id,
          amount: numericAmount,
        },
      })
    } catch (error) {
      console.error("Error during payment initiation:", {
        message: error.message,
        stack: error.stack,
      })
  
      return res.status(500).json({
        status: "ERROR",
        message: error.message || "Failed to initiate payment",
        code: "PAYMENT_INITIATION_ERROR",
      })
    }
  }

const validateRazorpayConfig = () => {
  const requiredConfig = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  }

  const missingConfig = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(", ")}`)
  }

  return requiredConfig
}

export const paymentCallback = async (req, res) => {
    try {

        const receivedData = req.body;
        
        
        if (!receivedData || !receivedData.body || !receivedData.head) {

            console.error('Invalid callback data structure:', {
                body: req.body,
                headers: req.headers
            });
            return res.status(400).json({ 
                status: 'ERROR', 
                message: 'Invalid callback data',
                details: process.env.NODE_ENV === 'development' ? {
                    receivedData: receivedData,
                    headers: req.headers
                } : undefined
            });
        }

        // Verify checksum
        const isValidChecksum = await PaytmChecksum.verifySignature(
            JSON.stringify(receivedData.body),
            process.env.PAYTM_MERCHANT_KEY,
            receivedData.head.signature
        );

        if (!isValidChecksum) {
            console.error('Checksum verification failed for order:', receivedData.body?.ORDERID);
            return res.status(400).json({ status: 'ERROR', message: 'Checksum verification failed' });
        }


        const { ORDERID, STATUS, TXNAMOUNT, TXNDATE, BANKTXNID, RESPCODE, RESPMSG } = receivedData.body;

        // Get temporary booking from session
        const tempBooking = req.session.tempBooking;
        if (!tempBooking || tempBooking.paytmOrderId !== ORDERID) {
            console.error('Invalid or missing booking reference for order:', ORDERID);
            return res.status(400).json({ 
                status: 'ERROR', 
                message: 'Invalid booking reference' 
            });
        }

        // Check payment status with retry mechanism
        const updateBooking = async (statusData) => {
            try {
                await Booking.findByIdAndUpdate(ORDERID, statusData);
            } catch (updateError) {
                console.error('Failed to update booking status:', updateError);
                // Retry once after 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    await Booking.findByIdAndUpdate(ORDERID, statusData);
                } catch (retryError) {
                    console.error('Failed to update booking status on retry:', retryError);
                    throw retryError;
                }
            }
        };

        if (STATUS === 'TXN_SUCCESS' && RESPCODE === '01') {
            
            await Booking.findOneAndUpdate(
                { paymentReference: ORDERID },

                {
                    paymentStatus: 'PAID',
                    paymentDate: new Date(TXNDATE),
                    paymentAmount: TXNAMOUNT,
                    paymentReference: BANKTXNID,
                    status: 'CONFIRMED'
                }
            );
            
            // Clear temporary booking from session
            delete req.session.tempBooking;

            return res.redirect(`${process.env.FRONTEND_URL}/booking-success/${ORDERID}`);
        } else {
            await updateBooking({
                paymentStatus: 'FAILED',
                status: 'PAYMENT_FAILED',
                paymentError: RESPMSG,
                paymentErrorCode: RESPCODE
            });

            return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?orderId=${ORDERID}&error=${encodeURIComponent(RESPMSG)}`);
        }

    } catch (error) {
        console.error('Payment callback processing error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=${encodeURIComponent(error.message)}`);
    }
};

export const verifyPayment = async (req, res) => {
    try {
      const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body
  
      if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          status: "ERROR",
          message: "Missing required verification parameters",
        })
      }
      
      
      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex")
  
      const isSignatureValid = generatedSignature === razorpay_signature
  
      if (!isSignatureValid) {
        // Find booking by order ID
        const booking = await Booking.findOne({ paymentReference: orderId })
        if (booking) {
          await Booking.findByIdAndUpdate(booking._id, {
            paymentStatus: "FAILED",
            status: "PAYMENT_FAILED",
            paymentError: "Payment signature verification failed",
          })
        }
  
        return res.status(400).json({
          status: "ERROR",
          message: "Payment verification failed: Invalid signature",
        })
      }
  
      // Find booking by order ID
      const booking = await Booking.findOne({ paymentReference: razorpay_payment_id })

      if (!booking) {
        return res.status(404).json({
          status: "ERROR",
          message: "Booking not found",
        })
      }
  
      // Update booking status
      const bookingUpdate = await Booking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: "PAID",
          paymentDate: new Date(),
          paymentAmount: booking.totalPrice,
          paymentReference: razorpay_payment_id,
          status: "CONFIRMED",
        },
        { new: true },
      )
  
      return res.json({
        status: "SUCCESS",
        message: "Payment verified successfully",
        data: {
          bookingUpdate: bookingUpdate,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        },
      })
    } catch (error) {
      console.error("Payment verification error:", error)
      res.status(500).json({
        status: "ERROR",
        message: error.message || "Failed to verify payment",
        code: error.code,
        details:
          process.env.NODE_ENV === "development"
            ? {
                stack: error.stack,
                cause: error.cause,
              }
            : undefined,
      })
    }
  }

export default router;
