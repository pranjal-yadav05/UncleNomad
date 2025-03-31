import express from "express";
import multer from "multer";
import { validateApiKey } from "../middleware/auth.js";
import {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadImage,
} from "../controllers/blogController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
        )
      );
    }
  },
});

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlog);

// Protected routes (require API key)
router.post("/", validateApiKey, createBlog);
router.put("/:id", validateApiKey, updateBlog);
router.delete("/:id", validateApiKey, deleteBlog);

// Image upload route
router.post("/upload", validateApiKey, upload.single("image"), uploadImage);

export default router;
