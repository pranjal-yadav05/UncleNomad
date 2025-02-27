import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ManageMedia = () => {
  const [media, setMedia] = useState([]);
  const [newMedia, setNewMedia] = useState({
    type: 'image',
    file: null,
    url: '',
    duration: 5
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/media`);
      setMedia(response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load media content");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const fileType = file.type.split('/')[0];
      if ((newMedia.type === 'image' && fileType !== 'image') || 
          (newMedia.type === 'video' && fileType !== 'video')) {
        setErrorMessage(`Please select a ${newMedia.type} file`);
        e.target.value = null;
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File size should be less than 10MB");
        e.target.value = null;
        return;
      }
      
      setNewMedia(prev => ({ ...prev, file }));
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddMedia = async () => {
    if (uploadMethod === 'file' && !newMedia.file) {
      setErrorMessage("Please select a file to upload");
      return;
    }
  
    if (uploadMethod === 'url' && (!urlInput || !validateUrl(urlInput))) {
      setErrorMessage("Please enter a valid URL");
      return;
    }
  
    try {
      setUploading(true);
      
      let mediaData = {
        type: newMedia.type,
        duration: Number(newMedia.duration) || 5
      };
  
      if (uploadMethod === 'file') {
        // Upload file to Cloudinary
        const formData = new FormData();
        formData.append('file', newMedia.file);
        // Explicitly append type to ensure it's included in the request
        formData.append('type', newMedia.type);
        
        console.log('Uploading file with type:', newMedia.type);
        
        const uploadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
  
        mediaData.url = uploadResponse.data.url;
        mediaData.publicId = uploadResponse.data.publicId;
      } else {
        // Use direct URL
        mediaData.url = urlInput;
      }
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/media`, mediaData);
      await fetchMedia();
      
      setNewMedia({ 
        type: 'image', 
        file: null, 
        url: '', 
        duration: 5 
      });
      setUrlInput('');
      
      setSuccessMessage("Media added successfully");
    } catch (error) {
      console.error('Error adding media:', error);
      setErrorMessage(error.response?.data?.message || "Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

// Frontend - ManageMedia.jsx
const handleDeleteMedia = async (id, publicId, type) => {
  if (!window.confirm("Are you sure you want to delete this media?")) return;

  try {
    // First log what we're trying to delete
    console.log('Attempting to delete:', { id, publicId, type });
    
    // Delete from Cloudinary if it has a publicId
    if (publicId) {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/upload`, { 
        data: { 
          publicId: publicId.trim(), // Ensure no whitespace
          resourceType: type === 'video' ? 'video' : 'image'  // Changed 'type' to 'resourceType'
        }
      });
    }
    
    // Delete from database
    await axios.delete(`${process.env.REACT_APP_API_URL}/api/media/${id}`);
    await fetchMedia();
    
    setSuccessMessage("Media deleted successfully");
  } catch (error) {
    console.error('Delete operation failed:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    setErrorMessage(error.response?.data?.message || "Failed to delete media");
  }
};


  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(media);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setMedia(items);

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/media/order`, {
        media: items.map((item, index) => ({
          _id: item._id,
          order: index
        }))
      });
    } catch (error) {
      console.error('Error updating media order:', error);
      setErrorMessage("Failed to update media order");
      fetchMedia();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Hero Media</h2>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <h3 className="font-medium mb-4 text-lg">Add New Media</h3>
        
        {/* Upload Method Selection */}
        <div className="flex mb-4 gap-4">
          <Button 
            variant={uploadMethod === 'file' ? "default" : "outline"}
            onClick={() => setUploadMethod('file')}
            className="flex-1"
          >
            {/* Using text instead of icons */}
            Upload File
          </Button>
          <Button 
            variant={uploadMethod === 'url' ? "default" : "outline"}
            onClick={() => setUploadMethod('url')}
            className="flex-1"
          >
            Use URL
          </Button>
        </div>

        <div className="grid gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-40">
              <label className="block text-sm font-medium mb-1">Media Type</label>
              <select
                value={newMedia.type}
                onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {uploadMethod === 'file' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept={newMedia.type === 'image' ? 'image/*' : 'video/*'}
                />
                {newMedia.file && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(newMedia.file.size)}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Media URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            )}

            {newMedia.type === 'image' && (
              <div className="w-full sm:w-32">
                <label className="block text-sm font-medium mb-1">Duration (sec)</label>
                <Input
                  type="number"
                  value={newMedia.duration}
                  onChange={(e) => setNewMedia({ ...newMedia, duration: e.target.value })}
                  min="1"
                  max="60"
                />
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={handleAddMedia} 
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? "Uploading..." : "Add Media"}
        </Button>
      </div>

      <h3 className="font-medium mb-4 text-lg">Media List</h3>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No media found. Add some media to get started.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="media">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {media.map((item, index) => (
                  <Draggable key={item._id} draggableId={item._id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-4 border rounded bg-white shadow-sm hover:shadow transition-shadow"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className="text-gray-500 font-medium w-6">{index + 1}.</span>
                          <div className="h-16 w-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.type === 'image' ? (
                              <img 
                                src={item.url} 
                                alt="Media thumbnail" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <video 
                                  src={item.url} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-sm truncate max-w-md" title={item.url}>
                              {item.url}
                            </p>
                            <div className="flex mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                                {item.type}
                              </span>
                              {item.duration && item.type === 'image' && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {item.duration}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteMedia(item._id, item.publicId, item.type)}
                          className="flex-shrink-0"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default ManageMedia;
