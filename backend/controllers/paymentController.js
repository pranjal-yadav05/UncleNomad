import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import { Router } from 'express';
import Booking from '../models/Booking.js';

const router = Router();

export const initiatePayment = async (req, res) => {

    try {
        const { bookingData, amount, customerId, email, phone } = req.body;
        
        // Validate required fields
        if (!bookingData || !amount || !email || !phone) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Missing required fields for payment initiation'
            });
        }

        // Validate configuration
        const config = validatePaytmConfig();
        
        // Validate amount format
        const numericAmount = parseFloat(bookingData.totalAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Invalid amount value'
            });
        }

        // Format order ID with timestamp to ensure uniqueness
        const timestamp = new Date().getTime();
        const formattedOrderId = `ORDER_${timestamp}_${email.split('@')[0].substring(0, 6)}`;

        // Prepare parameters with strict validation
        const paytmParams = {
            body: {
                requestType: "Payment",
                mid: config.PAYTM_MID,
                websiteName: config.PAYTM_WEBSITE,
                orderId: formattedOrderId,
                callbackUrl: config.PAYTM_CALLBACK_URL,
                txnAmount: {
                    value: numericAmount.toFixed(2),
                    currency: "INR",
                },
                userInfo: {
                    custId: email.split('@')[0].substring(0, 20),  // Using email prefix as customer ID
                    email: email.substring(0, 50),
                    mobile: phone.toString().replace(/\D/g, '').substring(0, 15)
                },
            }
        };

        // Generate checksum
        const checksum = await PaytmChecksum.generateSignature(
            JSON.stringify(paytmParams.body),
            config.PAYTM_MERCHANT_KEY
        );

        paytmParams.head = {
            signature: checksum
        };

        const post_data = JSON.stringify(paytmParams);
        
        // Get API URL based on environment
        const hostname = process.env.PAYTM_HOSTNAME;
        const apiPath = `/theia/api/v1/initiateTransaction?mid=${config.PAYTM_MID}&orderId=${formattedOrderId}`;

        // Make API call with enhanced error handling
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: hostname,
                port: 443,
                path: apiPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                },
                timeout: 10000
            };

            const req = https.request(options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {


                    try {
                        const parsedData = JSON.parse(data);

                        
                        // Check if the response has the expected structure
                        if (!parsedData || typeof parsedData !== 'object') {
                            reject(new Error('Invalid response format from payment gateway'));
                            return;
                        }

                        resolve(parsedData);
                    } catch (e) {
                        console.error('Response parsing error:', e);
                        reject(new Error(`Failed to parse payment gateway response: ${e.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Payment API request error:', error);
                reject(new Error(`Payment gateway connection error: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Payment gateway request timed out'));
            });

            req.write(post_data);
            req.end();
        });


        if (!response.body) {
            throw new Error('Invalid response structure from payment gateway');
        }

        // Check for error response from Paytm
        if (response.body.resultInfo && response.body.resultInfo.resultStatus === 'F') {
            throw new Error(response.body.resultInfo.resultMsg || 'Payment initiation failed');
        }

        // Validate transaction token with detailed error
        if (!response.body.txnToken) {
            const errorMsg = response.body.resultInfo?.resultMsg || 'Transaction token not received';
        console.error('Error retrieving transaction token:', {

                response: response.body,
                resultInfo: response.body.resultInfo
            });
            throw new Error(errorMsg);
        }

        // Store temporary booking reference
        const tempBooking = {
            ...bookingData,
            paymentStatus: 'INITIATED',
            paymentInitiatedAt: new Date(),
            paytmOrderId: formattedOrderId,
            status: 'PENDING',
            paymentReference: formattedOrderId
        };

        if (req.session) {
            req.session.tempBooking = tempBooking;
        } else {
            console.warn('Session not available for storing booking data');
        }


        return res.json({
            status: 'SUCCESS',
            data: {
                mid: config.PAYTM_MID,
                orderId: formattedOrderId,
                txnToken: response.body.txnToken,
                amount: numericAmount.toFixed(2),
                callbackUrl: config.PAYTM_CALLBACK_URL,
            }
        });

    } catch (error) {
        console.error('Error during payment initiation:', {

            message: error.message,
            stack: error.stack,
            // Log additional context if available
            responseData: error.responseData
        });

        return res.status(500).json({
            status: 'ERROR',
            message: error.message || 'Failed to initiate payment',
            code: 'PAYMENT_INITIATION_ERROR'
        });
    }
};

const validatePaytmConfig = () => {
    const requiredConfig = {
        PAYTM_MID: process.env.PAYTM_MID,
        PAYTM_MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY,
        PAYTM_WEBSITE: process.env.PAYTM_WEBSITE,
        PAYTM_CALLBACK_URL: process.env.PAYTM_CALLBACK_URL
    };

    const missingConfig = Object.entries(requiredConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingConfig.length > 0) {
        throw new Error(`Missing configuration: ${missingConfig.join(', ')}`);
    }

    return requiredConfig;
};

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
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Order ID is required'
            });
        }

        // Validate Paytm configuration
        const config = validatePaytmConfig();

        // Prepare parameters for status check
        const paytmParams = {
            body: {
                mid: config.PAYTM_MID,
                orderId: orderId,
            }
        };

        // Generate checksum
        const checksum = await PaytmChecksum.generateSignature(
            JSON.stringify(paytmParams.body),
            config.PAYTM_MERCHANT_KEY
        );

        paytmParams.head = {
            signature: checksum
        };

        const post_data = JSON.stringify(paytmParams);

        // Get API URL based on environment
        const hostname = process.env.PAYTM_HOSTNAME;
        const apiPath = `/v3/order/status`;


        // Make API call to check transaction status
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: hostname,
                port: 443,
                path: apiPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            const req = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (e) {
                        reject(new Error(`Failed to parse Paytm response: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Payment status API request error:', error);
                reject(error);
            });

            req.write(post_data);
            req.end();
        });

        // Extract response body and head
        const { body, head } = response;
        
        // Verify response checksum only for the body
        const isValidChecksum = await PaytmChecksum.verifySignature(
            JSON.stringify(body),
            config.PAYTM_MERCHANT_KEY,
            head?.signature
        );

        if (!isValidChecksum) {
            console.error('Checksum verification failed:', {
                receivedSignature: head?.signature,
                bodyUsedForVerification: JSON.stringify(body)
            });
            throw new Error('Response checksum verification failed');
        }

        // Process the response
        if (body?.resultInfo?.resultStatus === 'TXN_SUCCESS') {
            
            const booking = await Booking.findOne({ paymentReference: orderId });
            if (!booking) {
                return res.status(404).json({
                    status: 'ERROR',
                    message: 'Booking not found'
                });
            }

            const bookingUpdate = await Booking.findByIdAndUpdate(booking._id, {
                paymentStatus: 'PAID',
                paymentDate: new Date(),
                paymentAmount: body.txnAmount,
                paymentReference: body.txnId,
                status: 'CONFIRMED'
            });

            return res.json({
                status: 'SUCCESS',
                message: 'Payment verified successfully',
                data: {
                    bookingUpdate: bookingUpdate,
                    orderId: orderId,
                    txnId: body.txnId,
                    txnAmount: body.txnAmount,
                    status: body.resultInfo.resultStatus,
                    bankTxnId: body.bankTxnId
                }
            });
        } else {
            // Update booking status as failed
            const booking = await Booking.findOne({ paymentReference: orderId });
            if (booking) {
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'FAILED',
                    status: 'PAYMENT_FAILED',
                    paymentError: body.resultInfo.resultMsg,
                    paymentErrorCode: body.resultInfo.resultCode
                });
            }

            return res.status(400).json({
                status: 'ERROR',
                message: body.resultInfo.resultMsg || 'Payment verification failed',
                data: {
                    orderId: orderId,
                    statusCode: body.resultInfo.resultCode,
                    statusMessage: body.resultInfo.resultMsg
                }
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: error.message || 'Failed to verify payment',
            code: error.code,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                cause: error.cause
            } : undefined
        });
    }
};

export default router;
