import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useEffect } from 'react';
import { X } from "lucide-react";

const PackageFormModal = ({ 
  isOpen, 
  onClose, 
  newPackage, 
  setNewPackage, 
  currentDay, 
  setCurrentDay, 
  handleAddPackage, 
  editMode,
  isUploading
}) => {

  
  const API_URL = process.env.REACT_APP_API_URL;
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);


  useEffect(() => {
    if (!isOpen) {
      setImagePreviews([]);
      setImageFiles([]);
    } else if (editMode && newPackage.images) {
      // Set existing images when editing
      setExistingImages(newPackage.images.filter(img => typeof img === "string"));
    }
  }, [isOpen, newPackage.images, editMode]);

  
  if(!isOpen) return null


  const handleRemoveNewImage = (index) => {
    const updatedPreviews = [...imagePreviews];
    const updatedFiles = [...imageFiles];

    // Revoke the object URL to free memory
    URL.revokeObjectURL(updatedPreviews[index].previewUrl);

    updatedPreviews.splice(index, 1);
    updatedFiles.splice(index, 1);

    setImagePreviews(updatedPreviews);
    setImageFiles(updatedFiles);

    setNewPackage({ ...newPackage, images: [...existingImages, ...updatedFiles] });
  };

  
  

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImagePreviews((prev) => [...prev, ...newImageFiles]);
    setImageFiles((prev) => [...prev, ...files]);

    setNewPackage({ 
      ...newPackage, 
      images: [...(newPackage.images || []), ...files] 
    });
  };

  const handleAddOrUpdateDay = () => {
    if (!currentDay.day || !currentDay.title || !currentDay.description || 
        !currentDay.activities || !currentDay.accommodation) {
      alert('Please fill all day fields');
      return;
    }
  
    const newDay = { 
      ...currentDay, 
      _id: editingDayIndex !== null ? newPackage.itinerary[editingDayIndex]._id : { "$oid": crypto.randomUUID() }
    };
  
    if (editingDayIndex !== null) {
      const updatedItinerary = [...newPackage.itinerary];
      updatedItinerary[editingDayIndex] = newDay;
      setNewPackage({ ...newPackage, itinerary: updatedItinerary });
      setEditingDayIndex(null);
    } else {
      setNewPackage({
        ...newPackage,
        itinerary: [...newPackage.itinerary, newDay]
      });
    }
  
    setCurrentDay({ day: '', title: '', description: '', activities: '', accommodation: '' });
  };

  const handleRemoveExistingImage = async (index) => {
    if (!editMode || !existingImages[index]) return;

    const tourId = newPackage._id;
    const imageIndex = index;
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_URL}/api/tours/${tourId}/image/${imageIndex}`, {
        headers:{
          "x-api-key": process.env.REACT_APP_API_KEY,
          "Authorization": `Bearer ${token}`
        },
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove image");
      }

      // Remove image from frontend state if API call succeeds
      const updatedImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(updatedImages);
      setNewPackage({ ...newPackage, images: [...updatedImages, ...imageFiles] });

    } catch (error) {
      console.error("❌ Error removing image:", error);
      alert("Failed to remove image. Please try again.");
    }
  };

  const handleCategoryChange = (e) => {
    setNewPackage({ ...newPackage, category: e.target.value });
  };  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {editMode ? 'Edit Package' : 'Add New Package'}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleAddPackage} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="images">Upload Images</Label>
              <Input id="images" type="file" accept="image/*" onChange={handleImageChange} multiple />
              
              {/* Existing Images */}
              {editMode && existingImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Existing Images</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative w-24 h-24">
                        <img 
                          src={url} 
                          alt="Existing Image" 
                          className="w-full h-full object-cover rounded"
                        />
                        <button 
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          onClick={() => handleRemoveExistingImage(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">New Images</h4>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((img, index) => (
                      <div key={`new-${index}`} className="relative w-24 h-24">
                        <img 
                          src={img.previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded"
                        />
                        <button 
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          onClick={() => handleRemoveNewImage(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Fields */}
              <div className="space-y-2">
                <Label htmlFor="title">Package ID</Label>
                <Input
                  id="id"
                  type="number"
                  value={newPackage.id}
                  onChange={(e) => setNewPackage({ ...newPackage, id: parseInt(e.target.value) || '' })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Package Title</Label>
                <Input
                  id="title"
                  value={newPackage.title}
                  onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                  required
                />
              </div>  

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newPackage.category}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Relaxation">Relaxation</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceOptions">Price Options</Label>
                {Object.entries(newPackage.priceOptions || {}).map(([key, value], index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Option (e.g., Solo Rider)"
                      value={key}
                      onChange={(e) => {
                        const updatedOptions = { ...newPackage.priceOptions };
                        const newKey = e.target.value;
                        if (key !== newKey) {
                          const currentValue = updatedOptions[key];
                          delete updatedOptions[key]; // Remove old key
                          updatedOptions[newKey] = currentValue;
                          setNewPackage({ ...newPackage, priceOptions: updatedOptions });
                        }
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price (e.g., 19999)"
                      value={value}
                      onChange={(e) => {
                        setNewPackage({
                          ...newPackage,
                          priceOptions: {
                            ...newPackage.priceOptions,
                            [key]: e.target.value,
                          },
                        });
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const updatedOptions = { ...newPackage.priceOptions };
                        delete updatedOptions[key];
                        setNewPackage({ ...newPackage, priceOptions: updatedOptions });
                      }}
                      className="text-red-500"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => {
                    setNewPackage({
                      ...newPackage,
                      priceOptions: { ...newPackage.priceOptions, "New Option": "" },
                    });
                  }}
                  className="mt-2"
                >
                  + Add Price Option
                </Button>
              </div>

              <div className="space-y-2">  
                <Label htmlFor="inclusions">Inclusions</Label>
                <Input
                  id="inclusions"
                  value={Array.isArray(newPackage.inclusions) ? newPackage.inclusions.join(', ') : ''}
                  onChange={(e) => setNewPackage({ ...newPackage, inclusions: e.target.value.split(', ') })}
                  required
                  placeholder="Item 1, Item 2, Item 3..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusions">Exclusions</Label>
                <Input
                  id="exclusions"
                  value={Array.isArray(newPackage.exclusions) ? newPackage.exclusions.join(', ') : ''}
                  onChange={(e) => setNewPackage({ ...newPackage, exclusions: e.target.value.split(', ') })}
                  required
                  placeholder="Item 1, Item 2, Item 3..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newPackage.duration}
                  onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                  required
                  placeholder="e.g., 7 Days / 6 Nights"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupSize">Group Size</Label>
                <Input
                  id="groupSize"
                  type="number"
                  value={newPackage.groupSize}
                  onChange={(e) => setNewPackage({ ...newPackage, groupSize: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newPackage.location}
                  onChange={(e) => setNewPackage({ ...newPackage, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  required
                />
              </div>

              {/* Fields for Start and End Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newPackage.startDate ? newPackage.startDate.split('T')[0] : ''}
                  onChange={(e) => setNewPackage({ 
                    ...newPackage, 
                    startDate: e.target.value
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPackage.endDate ? newPackage.endDate.split('T')[0] : ''}
                  onChange={(e) => setNewPackage({ 
                    ...newPackage, 
                    endDate: e.target.value
                  })}
                  required
                />
              </div>

              {/* Itinerary Section */}
              <div className="space-y-2 md:col-span-2">
                <h4 className="font-semibold">Itinerary</h4>
                {newPackage.itinerary && newPackage.itinerary.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {newPackage.itinerary.map((day, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Day {day.day}: {day.title}</p>
                            <p className="text-sm text-gray-600">{day.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDay(day);
                                setEditingDayIndex(index);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPackage(prev => ({
                                  ...prev,
                                  itinerary: prev.itinerary.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day Number</Label>
                    <Input
                      id="day"
                      type="number"
                      value={currentDay.day}
                      onChange={(e) => setCurrentDay({ ...currentDay, day: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayTitle">Day Title</Label>
                    <Input
                      id="dayTitle"
                      value={currentDay.title}
                      onChange={(e) => setCurrentDay({ ...currentDay, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dayDescription">Day Description</Label>
                    <Input
                      id="dayDescription"
                      value={currentDay.description}
                      onChange={(e) => setCurrentDay({ ...currentDay, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activities">Activities</Label>
                    <Input
                      id="activities"
                      value={currentDay.activities}
                      onChange={(e) => setCurrentDay({ ...currentDay, activities: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Input
                      id="accommodation"
                      value={currentDay.accommodation}
                      onChange={(e) => setCurrentDay({ ...currentDay, accommodation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    type="button"
                    onClick={handleAddOrUpdateDay}
                  >
                    {editingDayIndex !== null ? 'Update Day' : 'Add Day'}
                  </Button>
                  {newPackage.itinerary && newPackage.itinerary.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPackage(prev => ({
                          ...prev,
                          itinerary: []
                        }));
                      }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Clear All Days
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Uploading...' : (editMode ? 'Update Package' : 'Add Package')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageFormModal;