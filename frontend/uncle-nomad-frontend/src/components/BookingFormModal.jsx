import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function BookingFormModal({
  isOpen,
  onClose,
  newBooking,
  setNewBooking,
  handleBookingSubmit,
  editMode,
  rooms
}) {


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit Booking' : 'Add New Booking'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name</Label>
              <Input
                id="guestName"
                value={newBooking.guestName}
                onChange={(e) => setNewBooking({ ...newBooking, guestName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newBooking.email}
                onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newBooking.phone}
                onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Number of Guests</Label>
              <Input
                id="numberOfGuests"
                type="number"
                min="1"
                value={newBooking.numberOfGuests}
                onChange={(e) => setNewBooking({ ...newBooking, numberOfGuests: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={newBooking.checkIn.toISOString().split('T')[0]}
                onChange={(e) => setNewBooking({ ...newBooking, checkIn: new Date(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={newBooking.checkOut.toISOString().split('T')[0]}
                onChange={(e) => setNewBooking({ ...newBooking, checkOut: new Date(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfChildren">Number of Children</Label>
              <Input
                id="numberOfChildren"
                type="number"
                value={newBooking.numberOfChildren}
                onChange={(e) => setNewBooking({ ...newBooking, numberOfChildren: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Input
                id="specialRequests"
                value={newBooking.specialRequests}
                onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealIncluded">Meal Included</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mealIncluded"
                  checked={newBooking.mealIncluded}
                  onChange={(e) => setNewBooking({ ...newBooking, mealIncluded: e.target.checked })}
                />
                <Label htmlFor="mealIncluded">Include meals</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Rooms</Label>
              {rooms?.map((room) => {
                const selectedRoom = newBooking.rooms?.find(r => r.roomId === room._id);

                const currentCount = selectedRoom?.quantity || 0;
                return (
                  <div key={room._id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{room.type}</h4>
                        <p className="text-sm text-gray-500">₹{room.price}/night</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRooms = newBooking.rooms.filter(r => r.roomId !== room._id);
                            if (currentCount > 1) {
                              updatedRooms.push({
                                roomId: room._id,
                                quantity: currentCount - 1
                              });
                            }
                            setNewBooking(prev => ({
                              ...prev,
                              rooms: updatedRooms
                            }));
                          }}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                          disabled={currentCount === 0}
                        >

                          -
                        </button>
                        <span>{currentCount}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRooms = newBooking.rooms.filter(r => r.roomId !== room._id);
                            updatedRooms.push({
                              roomId: room._id,
                              quantity: currentCount + 1
                            });
                            setNewBooking(prev => ({
                              ...prev,
                              rooms: updatedRooms
                            }));
                          }}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        >

                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editMode ? 'Update Booking' : 'Add Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
