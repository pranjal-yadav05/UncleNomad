import express from "express";
import User from "../models/User.js";
import { validateApiKey, authenticateToken } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Create or update a user from phone authentication
router.post("/create-phone-user", validateApiKey, async (req, res) => {
  try {
    const { phone, name, firebaseUid } = req.body;
    console.log("Phone user creation request:", {
      phone,
      name,
      hasFirebaseUid: !!firebaseUid,
    });

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Check if user with this phone number already exists
    let user = await User.findOne({ phone });
    console.log("Existing user found:", !!user);

    if (user) {
      // Update existing user
      user.name = name || user.name;
      user.lastLogin = new Date();

      await user.save();
      console.log("Updated existing user:", {
        id: user._id,
        phone: user.phone,
        name: user.name,
      });

      // Generate JWT token
      const tokenPayload = {
        id: user._id.toString(),
        phone: user.phone,
        name: user.name,
      };
      console.log("Token payload for existing user:", tokenPayload);

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
      });
      console.log("Token generated for existing user, length:", token.length);

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
        },
        token,
      });
    } else {
      // Create new user with phone as primary identifier
      console.log("Creating new user with phone:", phone);

      const newUser = new User({
        phone,
        name,
        firebaseUid,
        lastLogin: new Date(),
      });

      await newUser.save();
      console.log("Created new user:", {
        id: newUser._id,
        phone: newUser.phone,
        name: newUser.name,
      });

      // Generate JWT token
      const tokenPayload = {
        id: newUser._id.toString(),
        phone: newUser.phone,
        name: newUser.name,
      };
      console.log("Token payload for new user:", tokenPayload);

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
      });
      console.log("Token generated for new user, length:", token.length);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser._id,
          phone: newUser.phone,
          name: newUser.name,
        },
        token,
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Get user profile
router.get("/profile", validateApiKey, authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-hashedPassword");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Update user name
router.put(
  "/update-name",
  validateApiKey,
  authenticateToken,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.name = name;
      await user.save();

      // Generate a new token with updated information
      const tokenPayload = {
        id: user._id.toString(),
        name: user.name,
      };

      // Add phone or email to token payload based on what's available
      if (user.phone) {
        tokenPayload.phone = user.phone;
      }
      if (user.email) {
        tokenPayload.email = user.email;
      }

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
      });

      res.status(200).json({
        success: true,
        message: "Name updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        token, // Return the new token
      });
    } catch (error) {
      console.error("Error updating user name:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

export default router;
