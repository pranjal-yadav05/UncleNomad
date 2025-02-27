import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export default function BookingDetailsModal({ isOpen, onClose, booking }) {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>Full details of the booking</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p><strong>Guest Name:</strong> {booking.guestName}</p>
          <p><strong>Email:</strong> {booking.email}</p>
          <p><strong>Phone:</strong> {booking.phone}</p>
          <p><strong>Rooms:</strong> {booking.rooms.map(room => `${room.roomType} (x${room.quantity})`).join(', ')}</p>
          <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleString(undefined, { dateStyle: 'medium' })}</p>
          <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleString(undefined, { dateStyle: 'medium' })}</p>
          <p><strong>Status:</strong> <span className="capitalize">{booking.status}</span></p>
          <p><strong>Guests:</strong> {booking.numberOfGuests}</p>
          <p><strong>Children:</strong> {booking.numberOfChildren}</p>
          <p><strong>Extra Beds:</strong> {booking.extraBeds}</p>
          <p><strong>Meal Included:</strong> {booking.mealIncluded ? 'Yes' : 'No'}</p>
          {booking.specialRequests && <p><strong>Special Requests:</strong> {booking.specialRequests}</p>}
          <p><strong>Total Price:</strong> ₹{booking.totalPrice}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
