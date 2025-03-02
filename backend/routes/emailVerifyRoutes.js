import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Otp from "../models/Otp.js";
import User from "../models/User.js";

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
  const { email, otp, name, phone } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const storedOtp = await Otp.findOne({ email });

    if (!storedOtp) return res.status(400).json({ message: "OTP expired or invalid" });
    if (storedOtp.otp !== otp) return res.status(400).json({ message: "Incorrect OTP" });

    // OTP is valid, create or login user
    let user = await User.findOne({ email });
    let statusMessage = "Logged in successfully";

    if (!user) {
      // Create new user if doesn't exist
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = new User({
        email,
        name: name || email.split('@')[0], // Use part of email as name if not provided
        phone: phone || '',
        hashedPassword,
        isEmailVerified: true
      });
      
      await user.save();
      statusMessage = "Account created and logged in successfully";
    } else {
      // Update last login time
      user.lastLogin = new Date();
      // Update user details if provided
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    // Generate authentication token
    const token = jwt.sign(
      { id: user._id, email: user.email, isVerified: user.isEmailVerified },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove OTP after successful verification
    await Otp.deleteOne({ email });
    
    // Return token in response
    res.json({ 
      message: statusMessage,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("OTP verification failed:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// Create authentication middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default router;
