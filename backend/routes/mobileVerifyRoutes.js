// import dotenv from 'dotenv'
// import express from 'express';
// import twilio from 'twilio';

// const router = express.Router();

// dotenv.config()

// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// router.post('/send-mobile-otp', async (req, res) => {
//     const { phone } = req.body;
//     try {
//         console.log("Sending OTP to:", phone);
        
//         const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
//             .verifications.create({ to: `+${phone}`, channel: 'sms' });

//         console.log("Twilio Response:", verification);

//         res.status(200).json({ success: true, message: "OTP sent successfully", sid: verification.sid });
//     } catch (error) {
//         console.error("Twilio Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// });


// router.post('/verify-mobile-otp', async (req, res) => {
//     const { phone, otp } = req.body;
//     try {
//         const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
//             .verificationChecks.create({ to: `+${phone}`, code: otp });

//         if (verificationCheck.status === 'approved') {
//             res.status(200).json({ success: true, message: "Mobile OTP verified successfully" });
//         } else {
//             res.status(400).json({ success: false, message: "Invalid OTP" });
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// });

// export default router
