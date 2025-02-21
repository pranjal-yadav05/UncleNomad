import Media from '../models/Media.js';

// Create new media
export const createMedia = async (req, res) => {
  try {
    const { type, url, publicId, duration } = req.body;
    
    if (!type || !url) {
      return res.status(400).json({ message: 'Type and URL are required' });
    }
    
    // Validate type
    if (type !== 'image' && type !== 'video') {
      return res.status(400).json({ message: 'Type must be "image" or "video"' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    // Get max order
    const lastMedia = await Media.findOne().sort({ order: -1 });
    const order = lastMedia ? lastMedia.order + 1 : 0;
    
    const media = new Media({
      type,
      url,
      publicId,
      duration: Number(duration) || null,
      order
    });
    
    await media.save();
    res.status(201).json(media);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all media sorted by order
export const getMedia = async (req, res) => {
  try {
    const media = await Media.find().sort({ order: 1 });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update media order
export const updateMediaOrder = async (req, res) => {
  try {
    const { media } = req.body;
    
    if (!media || !Array.isArray(media)) {
      return res.status(400).json({ message: 'Invalid media array' });
    }
    
    const updates = media.map(item => {
      if (!item._id) {
        throw new Error('Media ID is required for each item');
      }
      
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { order: item.order }
        }
      };
    });
    
    await Media.bulkWrite(updates);
    res.json({ message: 'Media order updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete media
export const deleteMedia = async (req, res) => {
    try {
      // Log the full request params to debug
      console.log('Delete request params:', req.params);
      
      // Get the ID from req.params._id (if using Mongoose) or req.params.id
      const mediaId = req.params._id || req.params.id;
      
      if (!mediaId) {
        console.log('No ID provided in request parameters');
        return res.status(400).json({ message: 'Media ID is required' });
      }
  
      console.log('Attempting to delete media with ID:', mediaId);
  
      // First find the media item to ensure it exists
      const mediaItem = await Media.findById(mediaId);
      
      if (!mediaItem) {
        console.log('Media not found with ID:', mediaId);
        return res.status(404).json({ message: 'Media not found' });
      }
  
      // Delete the media document
      const result = await Media.findByIdAndDelete(mediaId);
      
      if (!result) {
        console.log('Delete operation returned no result');
        return res.status(400).json({ message: 'Failed to delete media from database' });
      }
  
      console.log('Successfully deleted media:', result);
      
      res.json({ 
        message: 'Media deleted successfully from database',
        deletedItem: result
      });
    } catch (error) {
      console.error('Error in deleteMediaFromDB:', error);
      res.status(500).json({ 
        message: 'Server error while deleting media from database', 
        error: error.message 
      });
    }
  };