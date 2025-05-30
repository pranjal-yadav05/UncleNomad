import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";

import connectDB from "./db.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";

import roomRoutes from "./routes/roomRoutes.js";
import guidesRoutes from "./routes/guidesRoutes.js";
import toursRoutes from "./routes/toursRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import emailVerifyRoutes from "./routes/emailVerifyRoutes.js";
import tokenValidationRoutes from "./routes/tokenValidationRoutes.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";
import reviewsRoutes from "./routes/reviewRoutes.js";
import userReviewRoutes from "./routes/userReviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// const frontendUrl = process.env.FRONTEND_URL;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PROD_IN,
  process.env.PROD_COM,
  "https://www.unclenomad.in",
  "https://unclenomad.in",
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Origin not allowed:", origin);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "Accept",
      "Content-Length",
      "Content-Range",
      "Range",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600,
  })
);

// Add specific CORS headers for the upload route
app.use("/api/upload", (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-api-key, Accept, Content-Length, Content-Range, Range"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  }
  next();
});

app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  })
);
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  console.log(
    `API Key check: ${req.method} ${req.path} - Key ${
      apiKey ? "provided" : "missing"
    }`
  );

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log(`API Key validation failed: ${req.method} ${req.path}`);
    return res.status(401).json({ message: "Unauthorized access" });
  }
  next();
});

// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/auth", emailVerifyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guides", guidesRoutes);
app.use("/api/tours", toursRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/userreviews", userReviewRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/token", tokenValidationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/subscribe", subscribeRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware

app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.get("/", (req, res) => res.send("Welcome to the API server..."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
