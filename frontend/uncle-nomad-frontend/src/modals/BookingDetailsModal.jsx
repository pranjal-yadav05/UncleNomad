import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { formatDate } from "../utils/dateUtils";

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onDelete,
}) {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Room Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800 mb-2">
              Room Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
              {booking.rooms.map((room, index) => {
                // Use stored room properties or get from roomId if available
                const roomName =
                  room.roomName ||
                  (room.roomId && typeof room.roomId === "object"
                    ? room.roomId.name
                    : "Unknown Room");
                const roomType =
                  room.roomType ||
                  (room.roomId && typeof room.roomId === "object"
                    ? room.roomId.type
                    : "Unknown Type");
                const roomPrice =
                  room.price ||
                  (room.roomId && typeof room.roomId === "object"
                    ? room.roomId.price
                    : 0);
                const roomCapacity =
                  (room.roomId && typeof room.roomId === "object"
                    ? room.roomId.capacity
                    : 0) ||
                  room.capacity ||
                  0;

                return (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-md shadow-sm border">
                    <p className="break-words">
                      <strong>Type:</strong> {roomType}
                    </p>
                    <p>
                      <strong>Capacity:</strong> {roomCapacity} persons
                    </p>
                    <p>
                      <strong>Quantity:</strong> {room.quantity}
                    </p>
                    <p>
                      <strong>Price per Night:</strong> ₹{roomPrice}
                    </p>
                    <p>
                      <strong>Number of Nights:</strong> {room.numberOfNights}
                    </p>
                    {room.subtotal && (
                      <p>
                        <strong>Subtotal:</strong> ₹{room.subtotal}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Guest Information</h3>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p className="break-words">{booking.guestName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Email:
                </span>
                <p className="break-words overflow-hidden">{booking.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Phone:
                </span>
                <p>{booking.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Number of Guests:
                </span>
                <p>{booking.numberOfGuests}</p>
              </div>
              {booking.numberOfChildren > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Number of Children:
                  </span>
                  <p>{booking.numberOfChildren}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Meal Included:
                </span>
                <p>{booking.mealIncluded ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Booking ID:
                </span>
                <p className="font-mono text-sm break-words overflow-hidden">
                  {booking._id}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Check-In:
                </span>
                <p>{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Check-Out:
                </span>
                <p>{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Status:
                </span>
                <p className="capitalize">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      booking.status === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.status.toLowerCase()}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Payment Status:
                </span>
                <p className="capitalize">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      booking.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : booking.paymentStatus === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.paymentStatus
                      ? booking.paymentStatus.toLowerCase()
                      : "pending"}
                  </span>
                </p>
              </div>
              {booking.paymentReference && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">
                    Payment Reference:
                  </span>
                  <p className="font-mono text-sm break-words overflow-hidden">
                    {booking.paymentReference}
                  </p>
                </div>
              )}
              {booking.specialRequests && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">
                    Special Requests:
                  </span>
                  <p className="break-words">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-green-800 mb-2">
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Total Amount:
                </span>
                <p className="text-xl font-bold text-green-700">
                  ₹{booking.totalPrice}
                </p>
              </div>
              {booking.paymentDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Payment Date:
                  </span>
                  <p>{formatDate(booking.paymentDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2 mt-6">
          {onDelete && (
            <Button onClick={() => onDelete(booking._id)} variant="destructive">
              Delete
            </Button>
          )}

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
