import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Loader } from "lucide-react";

export default function StatsFormModal({
  isOpen,
  onClose,
  newStats,
  setNewStats,
  handleAddStats,
  editMode,
  isUploading,
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStats((prevStats) => ({
      ...prevStats,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6">
        <DialogTitle className="text-xl font-semibold">
          {editMode ? "Edit Stats" : "Add New Stats"}
        </DialogTitle>
        <DialogDescription className="mb-6 text-gray-600">
          {editMode ? "Modify the existing stats below." : "Enter the new stats details below."}
        </DialogDescription>

        <form onSubmit={handleAddStats} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="destinations" className="block font-medium">
              Destinations
            </label>
            <Input
              id="destinations"
              name="destinations"
              type="text"
              value={newStats.destinations}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tours" className="block font-medium">
              Tours
            </label>
            <Input
              id="tours"
              name="tours"
              type="text"
              value={newStats.tours}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="travellers" className="block font-medium">
              Happy Travellers
            </label>
            <Input
              id="travellers"
              name="travellers"
              type="text"
              value={newStats.travellers}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ratings" className="block font-medium">
              Average Rating
            </label>
            <Input
              id="ratings"
              name="ratings"
              type="text"
              value={newStats.ratings}
              onChange={handleInputChange}
              required
              step="0.1"
              min="0"
              max="5"
            />
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? <Loader size="sm" /> : editMode ? "Update Stats" : "Add Stats"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
