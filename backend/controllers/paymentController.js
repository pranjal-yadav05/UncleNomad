import PaytmChecksum from 'paytmchecksum';
import https from 'https';
import { Router } from 'express';
import Booking from '../models/Booking.js';

const router = Router();

export const initiatePayment = async (req, res) => {
    console.log('Incoming request body:', req.body);

    try {
        const { bookingData, amount, customerId, email, phone } = req.body;
        
        console.log('Payment initiated with booking data:', bookingData);

        // Validate required fields
        if (!bookingData || !amount || !email || !phone) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Missing required fields for payment initiation'
            });
        }

        // Validate configuration
        const config = validatePaytmConfig();
        console.log('Paytm configuration validated:', config);
        
        // Validate amount format
        const numericAmount = parseFloat(bookingData.totalAmount);
        console.log('Parsed numeric amount:', numericAmount);

        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Invalid amount value'
            });
        }

        // Format order ID with timestamp to ensure uniqueness
        const timestamp = new Date().getTime();
        const formattedOrderId = `ORDER_${timestamp}_${email.split('@')[0].substring(0, 6)}`;
        console.log('Generated order ID:', formattedOrderId);

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
        const isProduction = process.env.NODE_ENV === 'production';
        const hostname = isProduction ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
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
                    // Log the raw response for debugging
                    console.log('Raw Paytm response:', data);

                    try {
                        const parsedData = JSON.parse(data);
                        console.log('Parsed Paytm response:', parsedData);
                        
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

        // Enhanced response validation
        console.log('Validating response structure:', {
            hasBody: !!response.body,
            bodyContent: response.body,
            resultInfo: response.body?.resultInfo
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
            console.error('Transaction token error:', {
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

        console.log('Sending response to client:', {
            status: 'SUCCESS',
            data: {
                mid: config.PAYTM_MID,
                orderId: formattedOrderId,
                txnToken: response.body.txnToken,
                amount: numericAmount.toFixed(2),
                callbackUrl: config.PAYTM_CALLBACK_URL,
                environment: isProduction ? 'PROD' : 'STAGE'
            }
        });

        return res.json({
            status: 'SUCCESS',
            data: {
                mid: config.PAYTM_MID,
                orderId: formattedOrderId,
                txnToken: response.body.txnToken,
                amount: numericAmount.toFixed(2),
                callbackUrl: config.PAYTM_CALLBACK_URL,
                environment: isProduction ? 'PROD' : 'STAGE'
            }
        });

    } catch (error) {
        console.error('Payment initiation error:', {
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
        console.log('Payment callback received:', req.body);
        console.log('Headers:', req.headers);
        console.log('Callback URL:', process.env.PAYTM_CALLBACK_URL);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.originalUrl);

        const receivedData = req.body;
        
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));
        
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
        console.log('Verifying checksum...');
        const isValidChecksum = await PaytmChecksum.verifySignature(
            JSON.stringify(receivedData.body),
            process.env.PAYTM_MERCHANT_KEY,
            receivedData.head.signature
        );
        console.log('Checksum verification result:', isValidChecksum);

        if (!isValidChecksum) {
            console.error('Checksum verification failed for order:', receivedData.body?.ORDERID);
            return res.status(400).json({ status: 'ERROR', message: 'Checksum verification failed' });
        }

        // Log entire received data for debugging
        console.log('Full callback data:', JSON.stringify(receivedData, null, 2));

        const { ORDERID, STATUS, TXNAMOUNT, TXNDATE, BANKTXNID, RESPCODE, RESPMSG } = receivedData.body;

        // Log payment response with additional details
        console.log('Payment response details:', {
            orderId: ORDERID,
            status: STATUS,
            amount: TXNAMOUNT,
            responseCode: RESPCODE,
            responseMessage: RESPMSG,
            callbackTime: new Date().toISOString(),
            ipAddress: req.ip
        });

        // Debug log to check if we're reaching the success condition
        console.log('Checking payment status:', {
            STATUS,
            RESPCODE,
            isSuccess: STATUS === 'TXN_SUCCESS' && RESPCODE === '01'
        });

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
                console.log('Booking status updated successfully:', ORDERID);
            } catch (updateError) {
                console.error('Failed to update booking status:', updateError);
                // Retry once after 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    await Booking.findByIdAndUpdate(ORDERID, statusData);
                    console.log('Booking status updated on retry:', ORDERID);
                } catch (retryError) {
                    console.error('Failed to update booking status on retry:', retryError);
                    throw retryError;
                }
            }
        };

        if (STATUS === 'TXN_SUCCESS' && RESPCODE === '01') {
            console.log('Payment successful, updating booking status');
            
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

            console.log('Payment successful, redirecting to success page');
            return res.redirect(`${process.env.FRONTEND_URL}/booking-success/${ORDERID}`);
        } else {
            console.log('Payment failed, updating status');
            await updateBooking({
                paymentStatus: 'FAILED',
                status: 'PAYMENT_FAILED',
                paymentError: RESPMSG,
                paymentErrorCode: RESPCODE
            });

            console.log('Payment failed, redirecting to failure page');
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
        const isProduction = process.env.NODE_ENV === 'production';
        const hostname = isProduction ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
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

            console.log('Making request to Paytm Status API:', {
                url: `https://${hostname}${apiPath}`,
                method: 'POST',
                orderId: orderId
            });

            const req = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    console.log('Raw Paytm status response:', data);
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
        
        // Log response structure for debugging
        console.log('Response structure:', {
            hasBody: !!body,
            hasHead: !!head,
            headSignature: head?.signature,
            bodyKeys: body ? Object.keys(body) : []
        });

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
            // Find and update booking status using paymentReference
            console.log('orderId searching :',orderId)
            
            const booking = await Booking.findOne({ paymentReference: orderId });
            if (!booking) {
                console.log('booking not found....')
                return res.status(404).json({
                    status: 'ERROR',
                    message: 'Booking not found'
                });
            }

            await Booking.findByIdAndUpdate(booking._id, {
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
