import express from "express";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";
import { body, validationResult } from "express-validator"; // Input validation

const router = express.Router();

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB Schema
const FolderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  media: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
    },
  ],
});

const Folder = mongoose.model("Folder", FolderSchema);

// Middleware for Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

/* --------------------------- CREATE FOLDER --------------------------- */
router.post(
  "/folders",
  body("name").trim().notEmpty().withMessage("Folder name is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name } = req.body;
      const existingFolder = await Folder.findOne({ name });

      if (existingFolder) {
        return res.status(400).json({ message: "Folder already exists" });
      }

      const folder = new Folder({ name, media: [] });
      await folder.save();
      res.status(201).json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to create folder", error: error.message });
    }
  }
);

/* --------------------------- GET ALL FOLDERS --------------------------- */
router.get("/folders", async (req, res) => {
  try {
    const folders = await Folder.find();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch folders", error: error.message });
  }
});

/* ---------------------- GET MEDIA FROM A SPECIFIC FOLDER ---------------------- */
router.get("/folders/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const folder = await Folder.findOne({ name });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder.media);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch media", error: error.message });
  }
});

/* ---------------------- UPLOAD MEDIA TO A FOLDER ---------------------- */
router.post("/folders/:name/media", upload.single("file"), async (req, res) => {
    try {
      const { name } = req.params;
      const { type } = req.body;
      const folder = await Folder.findOne({ name });
  
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
      if (!["image", "video"].includes(type)) {
        return res.status(400).json({ message: "Invalid media type" });
      }
  
      // Upload file to Cloudinary
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { resource_type: type, folder: `gallery/${name}` },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Upload failed", error: error.message });
  
          // Extract only the unique publicId (remove folder prefix)
          const publicId = result.public_id.split("/").pop();
  
          folder.media.push({ url: result.secure_url, publicId, type });
          await folder.save();
          res.status(201).json({ message: "Media uploaded", media: folder.media });
        }
      );
  
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload media", error: error.message });
    }
  });
  

/* ---------------------- DELETE MEDIA FROM A FOLDER ---------------------- */
router.delete("/folders/:name/media/:publicId", async (req, res) => {
    try {
      const { name, publicId } = req.params;
      const folder = await Folder.findOne({ name });
  
      if (!folder) return res.status(404).json({ message: "Folder not found" });
  
      // Check if media exists in the folder
      const mediaItem = folder.media.find((item) => item.publicId === publicId);
      if (!mediaItem) return res.status(404).json({ message: "Media not found in folder" });
  
      // Remove from Cloudinary (add folder prefix back)
      await cloudinary.v2.uploader.destroy(`gallery/${name}/${publicId}`);
  
      // Remove from MongoDB
      folder.media = folder.media.filter((item) => item.publicId !== publicId);
      await folder.save();
  
      res.json({ message: "Media deleted", media: folder.media });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove media", error: error.message });
    }
  });
  

/* ---------------------- DELETE A FOLDER & ITS MEDIA ---------------------- */
router.delete("/folders/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const folder = await Folder.findOne({ name });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    // Delete each media file from Cloudinary
    for (let media of folder.media) {
      await cloudinary.v2.uploader.destroy(media.publicId);
    }

    // Delete folder from MongoDB
    await Folder.deleteOne({ name });

    res.json({ message: "Folder and its media deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete folder", error: error.message });
  }
});

export default router;
