import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

export default function BookingModal({
  isOpen,
  onClose,
  selectedRoom,
  bookingForm,
  setBookingForm,
  handleBookingSubmit,
  isLoading,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[500px] max-h-[90vh] bg-white p-4 sm:p-6 rounded-lg shadow-xl overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">Book Your Stay</DialogTitle>
          <DialogDescription className="text-gray-600">
            {selectedRoom && (
              <div className="mt-2">
                <p className="font-semibold text-gray-900">{selectedRoom.type}</p>
                <p className="text-brand-purple font-medium">₹{selectedRoom.price} per night</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="guestName" className="text-sm font-medium text-gray-900">
              Full Name
            </Label>
            <Input
              id="guestName"
              value={bookingForm.guestName}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, guestName: e.target.value }))}
              className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfGuests" className="text-sm font-medium text-gray-900">
              Number of Guests
            </Label>
            <Input
              id="numberOfGuests"
              type="number"
              min="1"
              max={selectedRoom?.capacity || 1}
              value={bookingForm.numberOfGuests}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, numberOfGuests: Number.parseInt(e.target.value) }))}
              className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-900">
              Special Requests
            </Label>
            <Textarea
              id="specialRequests"
              value={bookingForm.specialRequests}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special requests or requirements?"
              className="w-full min-h-[100px] border-gray-200 focus:ring-2 focus:ring-brand-purple resize-none"
            />
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="custom"
              disabled={isLoading}
              className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white"
            >
              {isLoading ? "Confirming..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}