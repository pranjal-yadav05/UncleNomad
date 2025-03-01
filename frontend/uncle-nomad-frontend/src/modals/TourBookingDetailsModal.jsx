import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function TourBookingDetailsModal({ isOpen, onClose, booking, tour }) {
  if (!booking) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tour Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tour Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800 mb-2">Tour Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p>{tour ? tour.title : 'Unknown Tour'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Price:</span>
                <p>₹{tour ? tour.price : 'N/A'} per person</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Duration:</span>
                <p>{tour ? `${tour.duration} days` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Location:</span>
                <p>{tour ? tour.location : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Guest Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p>{booking.guestName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p>{booking.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <p>{booking.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Group Size:</span>
                <p>{booking.groupSize} people</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Booking ID:</span>
                <p className="font-mono text-sm">{booking._id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Booking Date:</span>
                <p>{formatDate(booking.bookingDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className="capitalize">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.toLowerCase()}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Payment Status:</span>
                <p className="capitalize">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.paymentStatus.toLowerCase()}
                  </span>
                </p>
              </div>
              {booking.paymentReference && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">Payment Reference:</span>
                  <p className="font-mono text-sm">{booking.paymentReference}</p>
                </div>
              )}
              {booking.specialRequests && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">Special Requests:</span>
                  <p>{booking.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-green-800 mb-2">Payment Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Tour Price:</span>
                <p>₹{tour ? tour.price : 'N/A'} per person</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Group Size:</span>
                <p>{booking.groupSize} people</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                <p className="text-xl font-bold text-green-700">₹{booking.totalPrice}</p>
              </div>
              {booking.paymentDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Payment Date:</span>
                  <p>{formatDate(booking.paymentDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}