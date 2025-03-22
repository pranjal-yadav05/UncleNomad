import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useEffect } from "react";
import { formatDate } from "../utils/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function BookingFormModal({
  isOpen,
  onClose,
  newBooking,
  setNewBooking,
  handleBookingSubmit,
  editMode,
  rooms,
  modalError,
}) {
  // Handle escape key to close modal properly
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle room selection
  const handleRoomChange = (roomId, quantity) => {
    if (quantity < 0) return;

    // Find the room data for this roomId
    const roomData = rooms.find((room) => room._id === roomId);
    if (!roomData) return;

    // Find if this room is already in the rooms array
    const existingRoomIndex = newBooking.rooms.findIndex((r) => {
      // Handle both object and string roomId
      const bookingRoomId =
        typeof r.roomId === "object" ? r.roomId._id : r.roomId;
      return bookingRoomId === roomId;
    });

    // Prepare updated rooms array
    const updatedRooms = [...newBooking.rooms];

    if (quantity === 0 && existingRoomIndex !== -1) {
      // Remove the room if quantity is 0
      updatedRooms.splice(existingRoomIndex, 1);
    } else if (existingRoomIndex !== -1) {
      // Update existing room quantity
      updatedRooms[existingRoomIndex] = {
        ...updatedRooms[existingRoomIndex],
        roomId: roomId,
        roomName: roomData.name,
        roomType: roomData.type,
        quantity: quantity,
        price: roomData.price,
        capacity: roomData.capacity,
      };
    } else if (quantity > 0) {
      // Add new room
      updatedRooms.push({
        roomId: roomId,
        roomName: roomData.name,
        roomType: roomData.type,
        quantity: quantity,
        price: roomData.price,
        capacity: roomData.capacity,
      });
    }

    // Update state with new rooms array
    setNewBooking((prev) => ({
      ...prev,
      rooms: updatedRooms,
    }));
  };

  // In BookingFormModal component
  useEffect(() => {
    if (editMode && isOpen) {
      console.log("Edit mode activated with booking data:", newBooking);

      // Log room mapping information to debug
      if (newBooking.rooms && rooms) {
        console.log("Available rooms:", rooms);
        console.log("Selected rooms:", newBooking.rooms);

        // Check if roomId is an object or string and handle accordingly
        newBooking.rooms.forEach((room) => {
          console.log(
            `Room details - roomId: ${
              typeof room.roomId === "object" ? room.roomId._id : room.roomId
            }, roomName: ${room.roomName || "N/A"}, roomType: ${
              room.roomType || "N/A"
            }, quantity: ${room.quantity}`
          );
        });
      }

      // Ensure dates are properly formatted for date inputs
      if (typeof newBooking.checkIn === "string") {
        setNewBooking((prev) => ({
          ...prev,
          checkIn: new Date(prev.checkIn),
        }));
      }
      if (typeof newBooking.checkOut === "string") {
        setNewBooking((prev) => ({
          ...prev,
          checkOut: new Date(prev.checkOut),
        }));
      }
    }
  }, [editMode, isOpen, rooms]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Booking" : "Add New Booking"}
          </DialogTitle>
        </DialogHeader>
        {modalError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {modalError}
          </div>
        )}
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name</Label>
              <Input
                id="guestName"
                value={newBooking.guestName}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, guestName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newBooking.email}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newBooking.phone}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, phone: e.target.value })
                }
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
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    numberOfGuests: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={
                  newBooking.checkIn instanceof Date
                    ? newBooking.checkIn.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    checkIn: new Date(e.target.value),
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={
                  newBooking.checkOut instanceof Date
                    ? newBooking.checkOut.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    checkOut: new Date(e.target.value),
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfChildren">Number of Children</Label>
              <Input
                id="numberOfChildren"
                type="number"
                value={newBooking.numberOfChildren}
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    numberOfChildren: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Input
                id="specialRequests"
                value={newBooking.specialRequests}
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    specialRequests: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealIncluded">Meal Included</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mealIncluded"
                  checked={newBooking.mealIncluded}
                  onChange={(e) =>
                    setNewBooking({
                      ...newBooking,
                      mealIncluded: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="mealIncluded">Include meals</Label>
              </div>
            </div>

            {/* Status section with improved visibility */}
            <div className="md:col-span-2 border p-4 rounded-lg bg-gray-50 mt-2">
              <h3 className="font-medium text-gray-700 mb-3">Booking Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Booking Status</Label>
                  <Select
                    value={newBooking.status}
                    onValueChange={(value) =>
                      setNewBooking({ ...newBooking, status: value })
                    }>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {newBooking.status && (
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          newBooking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : newBooking.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {newBooking.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={newBooking.paymentStatus || "PENDING"}
                    onValueChange={(value) =>
                      setNewBooking({ ...newBooking, paymentStatus: value })
                    }>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  {newBooking.paymentStatus && (
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          newBooking.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-800"
                            : newBooking.paymentStatus === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {newBooking.paymentStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Rooms</Label>
              {rooms?.map((room) => {
                const selectedRoom = newBooking.rooms?.find((r) => {
                  // Handle both object and string roomId
                  const bookingRoomId =
                    typeof r.roomId === "object" ? r.roomId._id : r.roomId;
                  return bookingRoomId === room._id;
                });

                const currentCount = selectedRoom?.quantity || 0;
                return (
                  <div key={room._id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">
                          {room.name || room.type}
                        </h4>
                        <p className="text-sm text-gray-500">
                          ₹{room.price}/night
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRoomChange(room._id, currentCount - 1)
                          }
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                          disabled={currentCount === 0}>
                          -
                        </button>
                        <span>{currentCount}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRoomChange(room._id, currentCount + 1)
                          }
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">
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
              {editMode ? "Update Booking" : "Add Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
