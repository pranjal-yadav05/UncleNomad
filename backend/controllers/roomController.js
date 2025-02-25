import Room from '../models/Room.js';
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';
const unlinkAsync = promisify(fs.unlink);

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
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

// Create Room
export const createRoom = async (req, res) => {
  try {
    const { id, type, price, capacity, totalRooms } = req.body;
    // Parse other fields as needed, handling arrays and booleans
    const amenities = req.body['amenities[]'] ? 
      Array.isArray(req.body['amenities[]']) ? req.body['amenities[]'] : [req.body['amenities[]']] 
      : [];
    
    const mealIncluded = req.body.mealIncluded === 'true';
    const smokingAllowed = req.body.smokingAllowed === 'true';
    const alcoholAllowed = req.body.alcoholAllowed === 'true';
    const childrenAllowed = req.body.childrenAllowed === 'true';
    
    let imageUrl = '';

    // Check if a file was uploaded
    if (req.file) {
      console.log('File uploaded:', req.file);
      // Upload to Cloudinary with folder
      const result = await cloudinaryV2.uploader.upload(req.file.path, {
        folder: 'uncle-nomad',  // Add folder to match your uploadMedia function
        public_id: `room-${id}-${Date.now()}`  // Create unique ID
      });
      imageUrl = result.secure_url;
      await unlinkAsync(req.file.path);
      console.log('Cloudinary upload result:', result);
    } else {
      console.log('No file uploaded');
    }

    const newRoom = new Room({
      id,
      type,
      price,
      capacity,
      totalRooms,
      amenities,
      mealIncluded,
      mealPrice: Number(req.body.mealPrice || 0),
      extraBedPrice: Number(req.body.extraBedPrice || 0),
      smokingAllowed,
      alcoholAllowed,
      childrenAllowed,
      childrenPolicy: req.body.childrenPolicy || '',
      imageUrl 
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update Room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find existing room to preserve imageUrl if no new image is uploaded
    const existingRoom = await Room.findById(id);
    if (!existingRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Build the update object with all fields
    const updateData = {
      type: req.body.type,
      price: req.body.price,
      capacity: req.body.capacity,
      totalRooms: req.body.totalRooms,
      amenities: req.body['amenities[]'] ? 
        Array.isArray(req.body['amenities[]']) ? req.body['amenities[]'] : [req.body['amenities[]']] 
        : [],
      mealIncluded: req.body.mealIncluded === 'true',
      mealPrice: Number(req.body.mealPrice || 0),
      extraBedPrice: Number(req.body.extraBedPrice || 0),
      smokingAllowed: req.body.smokingAllowed === 'true',
      alcoholAllowed: req.body.alcoholAllowed === 'true',
      childrenAllowed: req.body.childrenAllowed === 'true',
      childrenPolicy: req.body.childrenPolicy || '',
      // Keep existing imageUrl if no new image is uploaded
      imageUrl: existingRoom.imageUrl
    };

    // Handle image upload if there's a new file
    if (req.file) {
      console.log('Updating with new file:', req.file);
      
      // Delete the old image from Cloudinary if it exists
      if (existingRoom.imageUrl) {
        try {
          // Extract the public ID from the existing image URL
          const urlPathname = new URL(existingRoom.imageUrl).pathname;
          const pathParts = urlPathname.split('/');
          
          // Get the filename without extension
          const filenameWithExt = pathParts[pathParts.length - 1];
          const filename = filenameWithExt.split('.')[0];
          
          // Find the folder structure - look for 'uncle-nomad' in the path
          let folderPath = '';
          let foundUncleNomad = false;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            if (foundUncleNomad || pathParts[i] === 'uncle-nomad') {
              foundUncleNomad = true;
              folderPath += pathParts[i] + '/';
            }
          }
          
          // Construct the proper public ID
          const publicId = folderPath + filename;
          
          console.log(`Deleting old room image with publicId: ${publicId}`);
          
          // Delete from Cloudinary
          const deleteResult = await cloudinaryV2.uploader.destroy(publicId, {
            resource_type: 'image',
            invalidate: true
          });
          
          console.log('Cloudinary delete result:', deleteResult);
        } catch (error) {
          console.error("Error deleting old room image from Cloudinary:", error);
          // Continue with the update even if the deletion fails
        }
      }
      
      // Upload new image
      const result = await cloudinaryV2.uploader.upload(req.file.path, {
        folder: 'uncle-nomad',
        public_id: `room-${id}-${Date.now()}`
      });
      updateData.imageUrl = result.secure_url;
      await unlinkAsync(req.file.path);
      console.log('Cloudinary update result:', result);
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    console.log('Updated room with image:', updatedRoom);
    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    console.error(error.stack);  // Log the full stack trace
    res.status(500).json({ message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
