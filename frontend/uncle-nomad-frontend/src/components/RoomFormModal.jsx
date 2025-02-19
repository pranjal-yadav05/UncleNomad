import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

export default function RoomFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  editMode
}) {
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'number' ? Number(value) : value
    setFormData({ ...formData, [name]: parsedValue })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Room ID</Label>
              <Input
                id="id"
                name="id"
                type="number"
                value={formData.id}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Room Type</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalRooms">Total Rooms</Label>
              <Input
                id="totalRooms"
                name="totalRooms"
                type="number"
                value={formData.totalRooms}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editMode ? 'Update Room' : 'Add Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
