import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useState, useEffect } from "react";
import { formatDate } from "../utils/dateUtils";

export default function TourBookingFormModal({
  isOpen,
  onClose,
  newBooking,
  setNewBooking,
  handleBookingSubmit,
  editMode,
  tours,
  modalError,
  formLoading,
}) {
  const [totalPrice, setTotalPrice] = useState(0);

  // Make sure tours is always treated as an array
  const toursArray = Array.isArray(tours) ? tours : [];

  // Calculate the total price when tourId or groupSize changes
  useEffect(() => {
    if (newBooking.tourId && newBooking.groupSize) {
      // Check if tourId is an object or a string
      const tourIdValue =
        typeof newBooking.tourId === "object"
          ? newBooking.tourId._id
          : newBooking.tourId;
      const selectedTour = toursArray.find((tour) => tour._id === tourIdValue);

      if (selectedTour) {
        const calculatedPrice = selectedTour.price * newBooking.groupSize;
        setTotalPrice(calculatedPrice);
        setNewBooking((prev) => ({ ...prev, totalAmount: calculatedPrice }));
      }
    }
  }, [newBooking.tourId, newBooking.groupSize, toursArray]);

  // Add a useEffect to handle date conversion when editing
  useEffect(() => {
    if (editMode && isOpen) {
      // Ensure the bookingDate is properly formatted for date inputs
      if (typeof newBooking.bookingDate === "string") {
        setNewBooking((prev) => ({
          ...prev,
          bookingDate: new Date(prev.bookingDate),
        }));
      }
    }
  }, [editMode, isOpen, newBooking.bookingDate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Tour Booking" : "Add New Tour Booking"}
          </DialogTitle>
        </DialogHeader>
        {modalError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {modalError}
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tour Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tourId">Select Tour</Label>
              <Select
                value={newBooking.tourId}
                onValueChange={(value) =>
                  setNewBooking({ ...newBooking, tourId: value })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {toursArray.map((tour) => (
                    <SelectItem key={tour._id} value={tour._id}>
                      {tour.title} - ₹{tour.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest Information */}
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
              <Label htmlFor="groupSize">Group Size</Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                value={newBooking.groupSize}
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    groupSize: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
            </div>

            {/* Booking Details */}
            <div className="space-y-2">
              <Label htmlFor="bookingDate">Booking Date</Label>
              <Input
                id="bookingDate"
                type="date"
                value={
                  newBooking.bookingDate instanceof Date
                    ? newBooking.bookingDate.toISOString().split("T")[0]
                    : typeof newBooking.bookingDate === "string"
                    ? newBooking.bookingDate
                    : ""
                }
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    bookingDate: new Date(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Booking Status</Label>
              <Select
                value={newBooking.status}
                onValueChange={(value) =>
                  setNewBooking({ ...newBooking, status: value })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={newBooking.paymentStatus}
                onValueChange={(value) =>
                  setNewBooking({ ...newBooking, paymentStatus: value })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="INITIATED">Initiated</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Note: Setting payment status to "Paid" or "Success" will mark
                the booking as paid and record the payment date.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
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

            {/* Total Price Display */}
            <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Price:</span>
                <span className="text-lg font-bold">
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>
              {newBooking.tourId && (
                <p className="text-sm text-gray-500 mt-1">
                  Based on tour price and group size
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {formLoading
                ? "Processing..."
                : editMode
                ? "Update Booking"
                : "Add Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
