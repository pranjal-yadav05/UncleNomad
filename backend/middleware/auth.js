import jwt from "jsonwebtoken";

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "Access denied. No API key provided." });
  }

  if (apiKey !== process.env.API_KEY) {
    console.log(
      `API Key mismatch. Received: ${apiKey}, Expected: ${process.env.API_KEY}`
    );
    return res.status(403).json({ message: "Invalid API key." });
  }

  next();
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log(`Auth header: ${authHeader ? "Present" : "Missing"}`);

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Access denied. No authorization header provided." });
  }

  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer TOKEN"

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    console.log(`Attempting to verify token: ${token.substring(0, 10)}...`);
    console.log(
      `JWT Secret length: ${
        process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
      }`
    );

    // Decode the token first to check the algorithm
    const decodedWithoutVerify = jwt.decode(token, { complete: true });
    console.log("Token header:", decodedWithoutVerify?.header);

    // Use the same algorithm for verification as was used for signing
    const algorithm = decodedWithoutVerify?.header?.alg || "HS256";
    console.log("Using algorithm:", algorithm);

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [algorithm],
    });

    console.log("Decoded token:", decoded);
    req.user = decoded; // Attach decoded user info to request
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(403).json({
        message: "Invalid token signature.",
        details: err.message,
      });
    }
    return res.status(403).json({
      message: "Invalid token.",
      details: err.message,
    });
  }
};
