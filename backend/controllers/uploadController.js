import cloudinary from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// uploadMedia controller
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    // Ensure type is a string and not an array
    const type = Array.isArray(req.body.type)
      ? req.body.type[0]
      : req.body.type || "image";

    console.log("Upload request details:", {
      mimetype: file.mimetype,
      type: type,
      size: file.size,
    });

    // Validate file type
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (type === "image" && !allowedImageTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid image format. Supported formats: JPG, PNG, GIF, WEBP",
      });
    }

    if (type === "video" && !allowedVideoTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid video format. Supported formats: MP4, WEBM, MOV",
      });
    }

    // Generate public ID
    const publicId = `${type}/${uuidv4()}`;

    // Set up upload options based on file type
    const uploadOptions = {
      resource_type: type,
      public_id: publicId,
      overwrite: true,
      quality: "auto",
      folder: "uncle-nomad",
      chunk_size: 6000000,
    };

    // For videos, add specific video options
    if (type === "video") {
      Object.assign(uploadOptions, {
        eager: [{ format: "mp4", quality: "auto" }],
        eager_async: true,
      });
    }

    console.log("Cloudinary upload options:", uploadOptions);

    // Create upload stream with error handling and timeout
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Add error handler for the stream
      uploadStream.on("error", (error) => {
        console.error("Upload stream error:", error);
        reject(error);
      });

      // Stream the buffer to Cloudinary with error handling
      const bufferStream = streamifier.createReadStream(file.buffer);
      bufferStream.on("error", (error) => {
        console.error("Buffer stream error:", error);
        reject(error);
      });

      bufferStream.pipe(uploadStream);
    });

    console.log("Upload successful:", {
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    });

    // Set CORS headers before sending response
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      ...(type === "video" && {
        eager: result.eager,
        playback_url: result.eager?.[0]?.secure_url || result.secure_url,
      }),
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    // Set CORS headers even for error responses
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");

    res.status(500).json({
      message: "Media upload failed",
      error: error.message,
      details: error.http_code
        ? `Cloudinary error ${error.http_code}`
        : "Server error",
    });
  }
};

// deleteMedia controller
export const deleteMedia = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    // Clean up the publicId by removing any duplicate folder references
    const cleanPublicId = publicId.replace(
      "uncle-nomad/uncle-nomad/",
      "uncle-nomad/"
    );

    try {
      const result = await cloudinary.v2.uploader.destroy(cleanPublicId, {
        resource_type: resourceType || "image",
        invalidate: true,
      });

      if (result.result === "not found") {
        // If the resource wasn't found, we should still consider this a success
        // as the end goal is for the resource to not exist
        return res.json({
          message: "Resource already deleted or not found in Cloudinary",
          result,
        });
      }

      if (result.result !== "ok") {
        return res.status(400).json({
          message: "Failed to delete from Cloudinary",
          details: result,
        });
      }

      res.json({ message: "Media deleted successfully", result });
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion error:", cloudinaryError);
      return res.status(400).json({
        message: "Cloudinary deletion failed",
        error: cloudinaryError.message,
      });
    }
  } catch (error) {
    console.error("Server error during deletion:", error);
    res.status(500).json({
      message: "Server error during media deletion",
      error: error.message,
    });
  }
};
