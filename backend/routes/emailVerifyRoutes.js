import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/Otp.js"; // Import OTP model

const router = express.Router();

// Configure Nodemailer (Replace with real credentials)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP

    // Store OTP in MongoDB (replace if it already exists)
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }, // Expires in 5 minutes
      { upsert: true, new: true }
    );

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });
  
    try {
      const storedOtp = await Otp.findOne({ email });
  
      if (!storedOtp) return res.status(400).json({ message: "OTP expired or invalid" });
  
      if (storedOtp.otp === otp) {
        await Otp.deleteOne({ email }); // Remove OTP after successful verification
        res.json({ message: "OTP verified successfully" });
      } else {
        res.status(400).json({ message: "Incorrect OTP" });
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      res.status(500).json({ message: "OTP verification failed" });
    }
  });
  
export default router;
