import Room from '../models/Room.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import streamifier from 'streamifier';
import Review from '../models/UserReview.js'
// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Fetch all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();

    const roomIds = rooms.map(room => room._id);
    const reviewsByRoom = await Review.aggregate([
      { $match: { bookingType: "room", itemId: { $in: roomIds }, status:'approved' } },
      { $sort: { createdAt: -1 } }, // Sort reviews by newest first
      { 
        $group: { 
          _id: "$itemId", 
          reviews: { $push: { userName: "$userName", rating: "$rating", comment: "$comment", createdAt: "$createdAt" } } 
        } 
      }
    ]);

    // Convert aggregation results into a map for quick lookup
    const reviewMap = {};
    reviewsByRoom.forEach(entry => {
      reviewMap[entry._id.toString()] = entry.reviews.slice(0, 4); // Take top 4 reviews
    });

    // Attach top 4 reviews to each tour
    const roomsWithReviews = rooms.map(room => ({
      ...room,
      reviews: reviewMap[room._id.toString()] || [] // Default to empty array if no reviews
    }));
    
    res.json(roomsWithReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single room by ID
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to delete image from Cloudinary
const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl) return null;
  
  try {
    const urlPathname = new URL(imageUrl).pathname;
    const pathParts = urlPathname.split('/');
    const filenameWithExt = pathParts[pathParts.length - 1];
    const filename = filenameWithExt.split('.')[0];

    let folderPath = '';
    let foundUncleNomad = false;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (foundUncleNomad || pathParts[i] === 'uncle-nomad') {
        foundUncleNomad = true;
        folderPath += pathParts[i] + '/';
      }
    }

    const publicId = folderPath + filename;
    
    return await cloudinaryV2.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return null;
  }
};

// Helper function to upload images to Cloudinary
const uploadToCloudinary = async (file, roomId, index) => {
  if (!file) return null;

  const publicId = `room-${roomId}-${Date.now()}-${index}`;

  try {
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          overwrite: true,
          quality: "auto",
          folder: "uncle-nomad",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (uploadError) {
    console.error("Error uploading to Cloudinary:", uploadError);
    return null;
  }
};

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const { type, price, capacity, totalRooms } = req.body;

    const amenities = req.body.amenities 
    ? typeof req.body.amenities === "string"
      ? req.body.amenities.split(",").map(a => a.trim()) // Convert string to array
      : req.body.amenities
    : [];
  

    const mealIncluded = req.body.mealIncluded === "true";
    const smokingAllowed = req.body.smokingAllowed === "true";
    const alcoholAllowed = req.body.alcoholAllowed === "true";
    const childrenAllowed = req.body.childrenAllowed === "true";

    const newRoom = new Room({
      type,
      price,
      capacity,
      totalRooms,
      amenities,
      mealIncluded,
      mealPrice: Number(req.body.mealPrice || 0),
      rating: Number(req.body.rating || 0),
      extraBedPrice: Number(req.body.extraBedPrice || 0),
      smokingAllowed,
      alcoholAllowed,
      childrenAllowed,
      childrenPolicy: req.body.childrenPolicy || "",
      imageUrls: [],
    });

    await newRoom.save();

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file, index) =>
        uploadToCloudinary(file, newRoom._id, index)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      newRoom.imageUrls = uploadedUrls.filter(url => url !== null);
      newRoom.imageUrl = newRoom.imageUrls.length > 0 ? newRoom.imageUrls[0] : "";

      await newRoom.save();
    }

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const existingRoom = await Room.findById(id);

    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    const amenities = req.body.amenities 
    ? typeof req.body.amenities === "string"
      ? req.body.amenities.split(",").map(a => a.trim()) // Convert string to array
      : req.body.amenities
    : [];

    const updateData = {
      type: req.body.type,
      price: req.body.price,
      capacity: req.body.capacity,
      totalRooms: req.body.totalRooms,
      amenities,
      mealIncluded: req.body.mealIncluded === "true",
      mealPrice: Number(req.body.mealPrice || 0),
      rating: Number(req.body.rating || 0), 
      extraBedPrice: Number(req.body.extraBedPrice || 0),
      smokingAllowed: req.body.smokingAllowed === "true",
      alcoholAllowed: req.body.alcoholAllowed === "true",
      childrenAllowed: req.body.childrenAllowed === "true",
      childrenPolicy: req.body.childrenPolicy || "",
      imageUrl: existingRoom.imageUrl,
      imageUrls: existingRoom.imageUrls || [],
    };

    if (req.files && req.files.length > 0) {
      const deletePromises = existingRoom.imageUrls.map(url => deleteCloudinaryImage(url));
      await Promise.all(deletePromises);

      const uploadPromises = req.files.map((file, index) =>
        uploadToCloudinary(file, existingRoom._id, index)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      updateData.imageUrls = uploadedUrls.filter(url => url !== null);
      updateData.imageUrl = updateData.imageUrls.length > 0 ? updateData.imageUrls[0] : "";
    }

    const updatedRoom = await Room.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.imageUrls && room.imageUrls.length > 0) {
      const deletePromises = room.imageUrls.map(url => deleteCloudinaryImage(url));
      await Promise.all(deletePromises);
    } else if (room.imageUrl) {
      await deleteCloudinaryImage(room.imageUrl);
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeRoomImage = async (req, res) => {
  try {
    const { roomId, imageIndex } = req.params;
    
    // Find the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if index is valid
    if (!room.imageUrls || imageIndex >= room.imageUrls.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    // Get the image URL to delete
    const imageUrlToDelete = room.imageUrls[imageIndex];

    // Step 1: Delete the image from Cloudinary
    const cloudinaryResponse = await deleteCloudinaryImage(imageUrlToDelete);
    
    if (cloudinaryResponse.result !== "ok") {
      return res.status(500).json({ message: 'Failed to delete image from Cloudinary' });
    }

    // Step 2: Remove the image from MongoDB using $pull
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { imageUrls: imageUrlToDelete } },
      { new: true }
    );

    // Step 3: If removed image was the main imageUrl, set a new one
    if (updatedRoom.imageUrl === imageUrlToDelete) {
      updatedRoom.imageUrl = updatedRoom.imageUrls.length > 0 ? updatedRoom.imageUrls[0] : "";
      await updatedRoom.save();
    }

    res.json({ message: 'Image removed successfully', updatedRoom });
  } catch (error) {
    console.error('Error removing image:', error);
    res.status(500).json({ message: error.message });
  }
};
