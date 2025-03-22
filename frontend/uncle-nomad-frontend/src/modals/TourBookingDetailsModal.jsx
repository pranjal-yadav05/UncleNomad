import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { formatDate } from "../utils/dateUtils";

export default function TourBookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onDelete,
}) {
  if (!booking) return null;

  // Helper function to format date with fallback
  const formatDateWithFallback = (date) => {
    if (!date) return "Not set";
    return formatDate(date);
  };

  // Determine tour details - handle both populated and non-populated cases
  const tourTitle = booking.tour?.title || "Tour details not available";
  const tourPrice =
    booking.tour?.price || booking.totalPrice / booking.groupSize || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tour Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tour Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800 mb-2">
              Tour Information
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <p>
                <span className="font-medium">Tour:</span> {tourTitle}
              </p>
              {booking.tour?.description && (
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {booking.tour.description}
                </p>
              )}
              {booking.tour?.location && (
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {booking.tour.location}
                </p>
              )}
              {booking.tour?.duration && (
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {booking.tour.duration}{" "}
                  {booking.tour.duration === 1 ? "day" : "days"}
                </p>
              )}
              <p>
                <span className="font-medium">Price per Person:</span> ₹
                {tourPrice}
              </p>
            </div>
          </div>

          {/* Guest Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Guest Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p className="break-words">{booking.guestName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Email:
                </span>
                <p className="break-words">{booking.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Phone:
                </span>
                <p>{booking.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Group Size:
                </span>
                <p>
                  {booking.groupSize}{" "}
                  {booking.groupSize === 1 ? "person" : "people"}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Booking ID:
                </span>
                <p className="font-mono text-sm break-words">{booking._id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Booking Date:
                </span>
                <p>{formatDateWithFallback(booking.bookingDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Created On:
                </span>
                <p>{formatDateWithFallback(booking.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Last Updated:
                </span>
                <p>{formatDateWithFallback(booking.updatedAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Status:
                </span>
                <p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      booking.status === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.status?.toLowerCase() || "pending"}
                  </span>
                </p>
              </div>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Total Amount:
                </span>
                <p className="text-xl font-bold text-green-700">
                  ₹{booking.totalPrice}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Payment Status:
                </span>
                <p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      booking.paymentStatus === "PAID" ||
                      booking.paymentStatus === "SUCCESS"
                        ? "bg-green-100 text-green-800"
                        : booking.paymentStatus === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : booking.paymentStatus === "INITIATED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.paymentStatus?.toLowerCase() || "pending"}
                  </span>
                </p>
              </div>
              {booking.paymentDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Payment Date:
                  </span>
                  <p>{formatDateWithFallback(booking.paymentDate)}</p>
                </div>
              )}
              {booking.paymentReference && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">
                    Payment Reference:
                  </span>
                  <p className="font-mono text-sm break-words">
                    {booking.paymentReference}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 space-x-2">
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
