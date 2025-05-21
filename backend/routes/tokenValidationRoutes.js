import express from "express";
import jwt from "jsonwebtoken";
import { authenticateToken, validateApiKey } from "../middleware/auth.js";

const router = express.Router();

router.get("/validate-token", authenticateToken, (req, res) => {
  console.log("Validating token:", req.user);
  res.json({ valid: true, user: req.user });
});

// Test endpoint for JWT configuration
router.get("/test-jwt", validateApiKey, (req, res) => {
  try {
    // Check if JWT_SECRET is properly set
    const secretSet = !!process.env.JWT_SECRET;
    const secretLength = process.env.JWT_SECRET
      ? process.env.JWT_SECRET.length
      : 0;

    // Create a test token
    const testPayload = { test: "data", timestamp: Date.now() };
    const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Try to verify the test token
    const verified = jwt.verify(testToken, process.env.JWT_SECRET);

    res.json({
      jwtSecretConfigured: secretSet,
      jwtSecretLength: secretLength,
      testTokenGenerated: !!testToken,
      testTokenVerified: !!verified,
      message: "JWT configuration appears to be working correctly",
    });
  } catch (error) {
    console.error("JWT test error:", error);
    res.status(500).json({
      error: error.message,
      jwtSecretConfigured: !!process.env.JWT_SECRET,
      message: "JWT configuration error detected",
    });
  }
});

// Decode token without verification (for debugging)
router.post("/decode-token", validateApiKey, (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // Just decode without verification
    const decoded = jwt.decode(token);
    res.json({
      decoded,
      isExpired: decoded.exp < Date.now() / 1000,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to decode token",
      error: error.message,
    });
  }
});

export default router;
