import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog"

const BookingConfirmationDialog = ({ booking, onClose }) => {
  if (!booking) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold mb-4">
            Booking Error
          </DialogTitle>
          <DialogDescription className="mb-4">
            Booking details could not be loaded. Please contact support.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    )
  }

  console.log('booking',booking)

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-lg font-semibold mb-4">
          Booking Confirmation
        </DialogTitle>
        <DialogDescription className="mb-4">
          Your booking has been successfully confirmed. Here are the details:
        </DialogDescription>
        
        <div className="space-y-2">
          <div>
            <span className="font-medium">Booking ID:</span> {booking._id}
          </div>
          <div>
            <span className="font-medium">Guest Name:</span> {booking.guestName}
          </div>
          <div>
            <span className="font-medium">Check-in:</span> {new Date(booking.checkIn).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Total Price:</span> ₹{booking.totalPrice}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BookingConfirmationDialog
