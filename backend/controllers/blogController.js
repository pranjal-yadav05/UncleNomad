import Blog from "../models/Blog.js";
import cloudinary from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import streamifier from "streamifier";
import { validateApiKey } from "../middleware/auth.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Get all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // If status query parameter is provided, filter by status
    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query).sort({ date: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single blog
export const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new blog
export const createBlog = async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a blog
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a blog
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete images from Cloudinary
    for (const section of blog.content) {
      if (section.type === "image" && section.imageUrl) {
        try {
          // Extract the full public ID from the URL including the folder name
          // The public ID should be something like "uncle-nomad/blog/uuid"
          // Example URL: https://res.cloudinary.com/cloudname/image/upload/v1234567890/uncle-nomad/blog/uuid.jpg

          // First try to extract from the result.public_id that might be stored
          if (section.publicId) {
            console.log(`Using stored public ID: ${section.publicId}`);
            await cloudinary.v2.uploader.destroy(section.publicId);
            continue;
          }

          // Otherwise extract from URL
          // Get everything after /upload/v.../
          const urlParts = section.imageUrl.split("/upload/");
          if (urlParts.length > 1) {
            // Remove version number (v1234567890/) if present
            const pathWithVersion = urlParts[1];
            const pathParts = pathWithVersion.split("/");

            // Remove version part if it exists (starts with 'v')
            let startIndex = 0;
            if (pathParts[0].startsWith("v")) {
              startIndex = 1;
            }

            // Construct the full public ID including folder name
            const fullPublicId = pathParts
              .slice(startIndex)
              .join("/")
              .split(".")[0];

            console.log(
              `Attempting to delete image with public ID: ${fullPublicId}`
            );

            const result = await cloudinary.v2.uploader.destroy(fullPublicId);
            console.log(`Cloudinary delete result: ${JSON.stringify(result)}`);
          } else {
            console.log(
              `Could not extract public ID from URL: ${section.imageUrl}`
            );
          }
        } catch (cloudinaryError) {
          console.error(
            `Error deleting image from Cloudinary: ${cloudinaryError.message}`
          );
          // Continue with blog deletion even if image deletion fails
        }
      }
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(`Error in deleteBlog: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;

    // Validate file type
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid image format. Supported formats: JPG, PNG, GIF, WEBP",
      });
    }

    // Generate public ID
    const publicId = `blog/${uuidv4()}`;

    // Create upload stream directly from buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          overwrite: true,
          quality: "auto",
          folder: "uncle-nomad",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Stream the buffer directly to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    console.log("Image uploaded to Cloudinary with public ID:", result.public_id);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ message: "Image upload failed", error: error.message });
  }
};
