import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function RoomFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  editMode,
  isLoading
}) {
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL;
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)

    // Add the new files to our state
    setImageFiles((prevFiles) => [...prevFiles, ...files])

    // Create preview URLs for the new files
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setImagePreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls])

    // Update formData with the files
    setFormData({
      ...formData,
      images: [...(formData.images || []), ...files],
    })
  }

  const removeImage = (index) => {
    // Create copies of the arrays
    const newFiles = [...imageFiles]
    const newPreviewUrls = [...imagePreviewUrls]

    // Remove the file and preview at the specified index
    newFiles.splice(index, 1)

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index])
    newPreviewUrls.splice(index, 1)

    // Update state
    setImageFiles(newFiles)
    setImagePreviewUrls(newPreviewUrls)

    // Update formData
    setFormData({
      ...formData,
      images: newFiles,
    })
  }

  const removeExistingImage = async (index) => {
    if (!editMode || !formData.existingImages[index]) return;
  
    const roomId = formData._id;
    const imageUrl = formData.existingImages[index];
  
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/image/${index}`, {
        method: "DELETE",
        headers:{
          "x-api-key": process.env.REACT_APP_API_KEY
        }
      });
  
      if (!response.ok) {
        throw new Error("Failed to remove image");
      }
  
      // Remove image from frontend state if API call succeeds
      const updatedImages = formData.existingImages.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        existingImages: updatedImages,
      });
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove image. Please try again.");
    }
  };
  
  useEffect(() => {
    // Reset image state when form closes
    if (!isOpen) {
      setImageFiles([]);
      setImagePreviewUrls([]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Initialize existing images for edit mode
    if (editMode && formData.imageUrls && formData.imageUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        existingImages: [...formData.imageUrls]
      }));
    }
  }, [editMode, formData.imageUrls, setFormData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Basic Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Room Type</Label>
              <Input id="type" name="type" value={formData.type} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalRooms">Total Rooms</Label>
              <Input id="totalRooms" name="totalRooms" type="number" value={formData.totalRooms} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Room Images */}
          <div className="space-y-2">
            <Label htmlFor="images">Room Images</Label>
            <Input 
              id="images" 
              name="images" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              multiple
              className="mb-2"
            />
            
            {/* Display existing images */}
            {editMode && formData.existingImages && formData.existingImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Existing Images</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative w-24 h-24">
                      <img 
                        src={url} 
                        alt={`Room ${index + 1}`} 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Display new image previews */}
            {imagePreviewUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">New Images</h4>
                <div className="flex flex-wrap gap-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative w-24 h-24">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Amenities (Multi-Select) */}
          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (Comma Separated)</Label>
            <Input
              id="amenities"
              name="amenities"
              value={formData.amenities || ""} // Ensure it's always a string
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} // Store as a string
            />
          </div>

          {/* Boolean Fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mealIncluded" name="mealIncluded" checked={formData.mealIncluded} onChange={handleInputChange} />
              <Label htmlFor="mealIncluded">Meals Included</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smokingAllowed" name="smokingAllowed" checked={formData.smokingAllowed} onChange={handleInputChange} />
              <Label htmlFor="smokingAllowed">Smoking Allowed</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="alcoholAllowed" name="alcoholAllowed" checked={formData.alcoholAllowed} onChange={handleInputChange} />
              <Label htmlFor="alcoholAllowed">Alcohol Allowed</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="childrenAllowed" name="childrenAllowed" checked={formData.childrenAllowed} onChange={handleInputChange} />
              <Label htmlFor="childrenAllowed">Children Allowed</Label>
            </div>
          </div>

          {/* Additional Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mealPrice">Meal Price (if not included)</Label>
              <Input id="mealPrice" name="mealPrice" type="number" value={formData.mealPrice} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraBedPrice">Extra Bed Price</Label>
              <Input id="extraBedPrice" name="extraBedPrice" type="number" value={formData.extraBedPrice} onChange={handleInputChange} />
            </div>
          </div>

          {/* Children Policy */}
          <div className="space-y-2">
            <Label htmlFor="childrenPolicy">Children Policy</Label>
            <textarea
              id="childrenPolicy"
              name="childrenPolicy"
              value={formData.childrenPolicy}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Beds Configuration */}
          <div className="space-y-2">
            <Label>Beds Configuration</Label>
            {formData.beds?.map((bed, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="Number of Beds"
                  value={bed.number}
                  onChange={(e) => {
                    const newBeds = [...formData.beds];
                    newBeds[index].number = Number(e.target.value);
                    setFormData({ ...formData, beds: newBeds });
                  }}
                  className="w-1/2"
                />
                <input
                  type="checkbox"
                  checked={bed.isOccupied}
                  onChange={(e) => {
                    const newBeds = [...formData.beds];
                    newBeds[index].isOccupied = e.target.checked;
                    setFormData({ ...formData, beds: newBeds });
                  }}
                />
                <Label>Occupied</Label>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => setFormData({ ...formData, beds: [...(formData.beds || []), { number: 1, isOccupied: false }] })}
            >
              + Add Bed
            </Button>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isLoading ? "Processing..." : editMode ? "Update Room" : "Add Room"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}