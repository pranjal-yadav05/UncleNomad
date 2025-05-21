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

    // Uncle Nomad Logo URL (Replace with actual image link if hosted)
    const logoUrl =
      "https://res.cloudinary.com/dzr2pobts/image/upload/v1742561753/logo2_lgqlkm.png";

    // Email HTML Template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; padding-bottom: 20px;">
          <img src="${logoUrl}" alt="Uncle Nomad Logo" style="max-width: 150px;"/>
          <h2 style="color: #333;">Uncle Nomad - OTP Verification</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; text-align: center;">
          <p style="font-size: 18px; color: #333;">Your One-Time Password (OTP) is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #d35400; margin: 10px 0;">${otp}</p>
          <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #888;">
          <p>If you didn't request this OTP, please ignore this email.</p>
          <p>For any support, contact <a href="mailto:support@unclenomad.com">support@unclenomad.com</a></p>
        </div>
      </div>
    `;

    // Send email with HTML
    await transporter.sendMail({
      from: `"Uncle Nomad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Uncle Nomad - Your OTP Code",
      html: emailHtml, // Send HTML instead of plain text
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, name, phone } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const storedOtp = await Otp.findOne({ email });

    if (!storedOtp)
      return res.status(400).json({ message: "OTP expired or invalid" });
    if (storedOtp.otp !== otp)
      return res.status(400).json({ message: "Incorrect OTP" });

    // OTP is valid, create or login user
    let user = await User.findOne({ email });
    let statusMessage = "Logged in successfully";

    if (!user) {
      // Create new user if doesn't exist
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new User({
        email,
        name: name || email.split("@")[0], // Use part of email as name if not provided
        phone: phone || "",
        hashedPassword,
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
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
        algorithm: "HS256",
      }
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
        name: user.name,
      },
    });
  } catch (error) {
    console.error("OTP verification failed:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// Create authentication middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Decode the token first to check the algorithm
    const decodedWithoutVerify = jwt.decode(token, { complete: true });
    const algorithm = decodedWithoutVerify?.header?.alg || "HS256";

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [algorithm],
    });

    // Check if user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token. User not found." });
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default router;
