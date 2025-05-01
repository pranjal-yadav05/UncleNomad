import express from "express";
const router = express.Router();
import { uploadMedia, deleteMedia } from "../controllers/uploadController.js";
import multer from "multer";


router.use((req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;
  
  // Check if the origin is allowed (same logic as your main CORS config)
  const allowedOrigins = [process.env.FRONTEND_URL, process.env.PROD_IN, process.env.PROD_COM].filter(Boolean);
  
  if (!origin || allowedOrigins.includes(origin)) {
    // Set proper CORS headers specifically for this route
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Get the type from the request body and ensure it's a string
    const type = Array.isArray(req.body?.type)
      ? req.body.type[0]
      : req.body?.type;

    // If type is not specified, check the mimetype
    if (!type) {
      if (file.mimetype.startsWith("video/")) {
        req.body.type = "video"; // Set the type for later use
        return cb(null, true);
      } else if (file.mimetype.startsWith("image/")) {
        req.body.type = "image"; // Set the type for later use
        return cb(null, true);
      }
      return cb(new Error("Invalid file type"));
    }

    // If type is specified, validate accordingly
    if (type === "video" && file.mimetype.startsWith("video/")) {
      req.body.type = "video"; // Ensure type is set correctly
      return cb(null, true);
    }
    if (type === "image" && file.mimetype.startsWith("image/")) {
      req.body.type = "image"; // Ensure type is set correctly
      return cb(null, true);
    }

    cb(new Error(`Only ${type} files are allowed for ${type} uploads`));
  },
});

// Upload media route - matches frontend API endpoint
router.post("/", upload.single("file"), uploadMedia);

// Delete media route - matches frontend call in handleDeleteMedia
router.delete("/", deleteMedia);

export default router;
