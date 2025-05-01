import express from "express";
const router = express.Router();
import { uploadMedia, deleteMedia } from "../controllers/uploadController.js";
import multer from "multer";

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

// Add timeout handling middleware
router.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout
  res.setTimeout(300000);
  next();
});

// Upload media route - matches frontend API endpoint
router.post("/", upload.single("file"), uploadMedia);

// Delete media route - matches frontend call in handleDeleteMedia
router.delete("/", deleteMedia);

export default router;
