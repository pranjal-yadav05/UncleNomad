import cloudinary from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// uploadMedia controller
export const uploadMedia = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }
  
      const file = req.file;
      const type = req.body.type || 'image';
      
      console.log('Upload request received:', { type, mimetype: file.mimetype, size: file.size });
      
      // Validate file type
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      
      if (type === 'image' && !allowedImageTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid image format. Supported formats: JPG, PNG, GIF, WEBP' });
      }
      
      if (type === 'video' && !allowedVideoTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid video format. Supported formats: MP4, WEBM, MOV' });
      }
  
      // Generate public ID
      const publicId = `${type}/${uuidv4()}`;
  
      // Create upload stream directly from buffer
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            resource_type: type === 'video' ? 'video' : 'image',
            public_id: publicId,
            overwrite: true,
            quality: 'auto',
            folder: 'uncle-nomad'
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        // Stream the buffer directly to Cloudinary
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
  
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: 'Media upload failed', error: error.message });
    }
};

// deleteMedia controller
export const deleteMedia = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    
    console.log('Delete request received:', { publicId, resourceType });

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Clean up the publicId by removing any duplicate folder references
    const cleanPublicId = publicId.replace('uncle-nomad/uncle-nomad/', 'uncle-nomad/');
    
    console.log('Attempting to delete with cleaned publicId:', cleanPublicId);

    try {
      const result = await cloudinary.v2.uploader.destroy(cleanPublicId, {
        resource_type: resourceType || 'image',
        invalidate: true
      });

      console.log('Cloudinary delete result:', result);

      if (result.result === 'not found') {
        // If the resource wasn't found, we should still consider this a success
        // as the end goal is for the resource to not exist
        return res.json({ 
          message: 'Resource already deleted or not found in Cloudinary',
          result
        });
      }

      if (result.result !== 'ok') {
        return res.status(400).json({ 
          message: 'Failed to delete from Cloudinary', 
          details: result 
        });
      }

      res.json({ message: 'Media deleted successfully', result });
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      return res.status(400).json({ 
        message: 'Cloudinary deletion failed', 
        error: cloudinaryError.message 
      });
    }
  } catch (error) {
    console.error('Server error during deletion:', error);
    res.status(500).json({ 
      message: 'Server error during media deletion', 
      error: error.message 
    });
  }
};