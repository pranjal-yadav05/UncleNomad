import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { X } from "lucide-react";

export default function ReviewFormModal({
  isOpen,
  onClose,
  newReview,
  setNewReview,
  handleAddReview,
  editMode,
  isUploading,
  setIsModalOpen,
}) {
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (typeof newReview.profile_photo_url === "string" && newReview.profile_photo_url) {
      setImagePreview(newReview.profile_photo_url);
    } else {
      setImagePreview(null);
    }
  }, [newReview.profile_photo_url]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewReview((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (value) => {
    setNewReview((prev) => ({ ...prev, rating: parseFloat(value) }));
  };

  const handleSourceChange = (value) => {
    setNewReview((prev) => ({ ...prev, source: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewReview((prev) => ({ ...prev, profile_photo_url: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setNewReview((prev) => ({ ...prev, profile_photo_url: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {editMode ? "Edit Review" : "Add New Review"}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
          </div>

          <form onSubmit={handleAddReview}>
            <div className="space-y-4">
              {/* Author Name */}
              <div>
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  name="author_name"
                  value={newReview.author_name}
                  onChange={handleChange}
                  placeholder="Author's name"
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Select
                  value={newReview.rating.toString()}
                  onValueChange={handleRatingChange}
                >
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 ★</SelectItem>
                    <SelectItem value="1.5">1.5 ★</SelectItem>
                    <SelectItem value="2">2 ★</SelectItem>
                    <SelectItem value="2.5">2.5 ★</SelectItem>
                    <SelectItem value="3">3 ★</SelectItem>
                    <SelectItem value="3.5">3.5 ★</SelectItem>
                    <SelectItem value="4">4 ★</SelectItem>
                    <SelectItem value="4.5">4.5 ★</SelectItem>
                    <SelectItem value="5">5 ★</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={newReview.source}
                  onValueChange={handleSourceChange}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Booking.com">Booking.com</SelectItem>
                    <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="text">Review Text</Label>
                <Textarea
                  id="text"
                  name="text"
                  value={newReview.text}
                  onChange={handleChange}
                  placeholder="What did the customer say?"
                  rows={4}
                  required
                />
              </div>

              {/* Profile Photo */}
              <div>
                <Label htmlFor="profile_photo">Profile Photo (Optional)</Label>
                <Input
                  id="profile_photo"
                  name="profile_photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="mb-2"
                />
                
                {imagePreview && (
                  <div className="relative w-16 h-16 mt-2">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-16 h-16 object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={clearImageSelection}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="custom"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  editMode ? "Update Review" : "Add Review"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}