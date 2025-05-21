import { useState } from "react";
import {
  MapPin,
  Star,
  CheckCircle,
  Calendar,
  Users,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertCircle,
  CreditCard,
  Banknote,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatDate } from "../utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { generateTourTicketTemplate } from "../templates/tourTicketTemplate";
import { formatDateDDMMYYYY } from "../templates/dateUtils";

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || "";

function TourBookingCard({
  booking,
  getStatusColor,
  openRatingDialog,
  hasReviewForTour,
}) {
  const [showItinerary, setShowItinerary] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  // Debug the booking object structure to understand the data
  console.log("Tour Booking Data:", booking);
  console.log("Selected Date:", booking.selectedDate);
  console.log("Selected Package:", booking.selectedPackage);

  // Check if booking is in the past
  const isPastBooking = new Date(booking.tourDate) < new Date();
  // Check if booking has already been rated
  const hasRating = booking.userRating && booking.userRating > 0;
  // Check if user has already reviewed this tour
  const hasReviewed = hasReviewForTour(booking._id);

  // Calculate tour duration with proper fallback for each property
  const formattedStartDate =
    booking.selectedDate &&
    typeof booking.selectedDate === "object" &&
    booking.selectedDate.startDate
      ? formatDate(booking.selectedDate.startDate)
      : booking.tourDate
      ? formatDate(booking.tourDate)
      : "N/A";

  const formattedEndDate =
    booking.selectedDate &&
    typeof booking.selectedDate === "object" &&
    booking.selectedDate.endDate
      ? formatDate(booking.selectedDate.endDate)
      : booking.tourEndDate
      ? formatDate(booking.tourEndDate)
      : formattedStartDate !== "N/A"
      ? formattedStartDate // Show same date if only start date is available
      : "N/A";

  // Check if itinerary exists
  const hasItinerary = booking.itinerary && booking.itinerary.length > 0;

  // Determine confirmation status
  const isConfirmed = booking.status === "Confirmed";
  const isPending = booking.status === "Pending";
  const isCancelled = booking.status === "Cancelled";

  // Payment status
  const hasPaymentInfo = booking.paymentReference || booking.paymentMethod;
  const isPaid = booking.paymentStatus === "Paid";
  const isPartiallyPaid = booking.paymentStatus === "Partially Paid";
  const isPaymentPending = booking.paymentStatus === "Pending";

  // Add the downloadTicket function
  const downloadTicket = () => {
    try {
      // Prepare data with proper date values and price
      const ticketData = {
        ...booking,
        // Ensure proper tour dates
        tourDate: booking.selectedDate?.startDate || booking.tourDate,
        tourEndDate: booking.selectedDate?.endDate || booking.tourEndDate,
        // Ensure price per person is available
        pricePerPerson:
          booking.selectedPackage?.price ||
          (booking.totalPrice && booking.groupSize
            ? Math.round(booking.totalPrice / booking.groupSize)
            : null),
        // Ensure tour image is available
        tourImage: booking.tour?.images?.[0] || booking.tourImage,
        // Ensure duration is available
        duration:
          booking.tour?.duration ||
          booking.duration ||
          (booking.selectedDate
            ? `${Math.ceil(
                (new Date(booking.selectedDate.endDate) -
                  new Date(booking.selectedDate.startDate)) /
                  (1000 * 60 * 60 * 24)
              )} days`
            : null),
        // Ensure tour name is available
        tourName: booking.tour?.name || booking.tourName,
      };

      // Generate the ticket HTML using the template
      const ticketHtml = generateTourTicketTemplate(
        ticketData,
        formatDateDDMMYYYY
      );

      // Create a new window and write the ticket HTML
      const ticketWindow = window.open("", "_blank");
      if (!ticketWindow) {
        alert("Please allow pop-ups to view the ticket");
        return;
      }

      // Write to the window and show the ticket
      ticketWindow.document.write(ticketHtml);
      ticketWindow.document.close();

      toast.success("Ticket generated successfully!");
    } catch (error) {
      toast.error(`Error generating ticket: ${error.message}`);
    }
  };

  return (
    <Card className="overflow-hidden w-full shadow-md hover:shadow-lg transition-shadow">
      {/* Status Banner */}
      <div
        className={`h-1 w-full ${
          isConfirmed
            ? "bg-green-500"
            : isPending
            ? "bg-amber-500"
            : isCancelled
            ? "bg-red-500"
            : "bg-blue-500"
        }`}></div>

      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center min-w-[150px]">
          {booking.tourImage ? (
            <img
              src={booking.tourImage}
              alt={booking.tourName || "Tour"}
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-40 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
              No Image Available
            </div>
          )}

          <div className="text-center mt-3">
            <h4 className="font-bold text-lg">
              {booking.tourName ||
                (booking.tour && booking.tour.title) ||
                "Tour Name Not Available"}
            </h4>
            {(booking.location || (booking.tour && booking.tour.location)) && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>
                  {booking.location || (booking.tour && booking.tour.location)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="p-4 sm:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">
                Booking #{booking._id.slice(-6)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={getStatusColor(booking.status)}
                  variant="outline">
                  {booking.status}
                </Badge>

                {isCancelled && booking.cancellationReason && (
                  <div className="relative group">
                    <div className="cursor-help">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="hidden group-hover:block absolute z-50 bg-black text-white px-2 py-1 text-xs rounded-md max-w-xs -translate-x-1/2 left-1/2 mt-1">
                      Reason: {booking.cancellationReason}
                    </div>
                  </div>
                )}

                {booking.paymentStatus && (
                  <Badge
                    variant="outline"
                    className={`ml-1 ${
                      isPaid
                        ? "bg-green-50 text-green-700 border-green-200"
                        : isPartiallyPaid
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}>
                    <CreditCard className="h-3 w-3 mr-1" />
                    {booking.paymentStatus}
                  </Badge>
                )}
              </div>
            </div>
            {booking.totalAmount && (
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <div className="font-semibold text-lg">
                  ₹{booking.totalAmount}
                </div>
                {booking.amountPaid &&
                  booking.amountPaid < booking.totalAmount && (
                    <div className="text-xs text-green-600">
                      ₹{booking.amountPaid} paid
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Guest Information */}
          <div className="bg-slate-50 p-3 rounded-md mb-4 text-sm">
            <div className="flex flex-wrap justify-between">
              <div className="mb-2 pr-2">
                <span className="text-slate-500">Guest:</span>{" "}
                {booking.guestName || "N/A"}
              </div>
              <div className="mb-2 pr-2">
                <span className="text-slate-500">Email:</span>{" "}
                {booking.email || "N/A"}
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>{" "}
                {booking.phone || "N/A"}
              </div>
            </div>
            {booking.specialRequests && (
              <div className="mt-1 text-xs border-t border-slate-200 pt-1">
                <span className="text-slate-500">Special Requests:</span>{" "}
                {booking.specialRequests}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Tour Dates</span>
              </div>
              <div className="font-medium">
                {formattedStartDate} - {formattedEndDate}
              </div>
            </div>

            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Duration</span>
              </div>
              <div className="font-medium">
                {booking.duration ||
                  (booking.tour && booking.tour.duration) ||
                  (booking.selectedDate &&
                    `${Math.ceil(
                      (new Date(booking.selectedDate.endDate) -
                        new Date(booking.selectedDate.startDate)) /
                        (1000 * 60 * 60 * 24)
                    )} days`) ||
                  "N/A"}
              </div>
            </div>

            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Users className="h-3 w-3 mr-1" />
                <span>Participants</span>
              </div>
              <div className="font-medium">
                {booking.groupSize || booking.participants || "N/A"}
              </div>
            </div>

            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Package className="h-3 w-3 mr-1" />
                <span>Package</span>
              </div>
              <div className="font-medium">
                {booking.selectedPackage?.name || "Standard Package"}
                {booking.selectedPackage?.price && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (₹{booking.selectedPackage.price}/person)
                  </span>
                )}
              </div>
            </div>
          </div>

          {booking.bookingDate && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center">
              <CalendarDays className="h-3 w-3 mr-1" />
              Booked on: {formatDate(booking.bookingDate)}
            </div>
          )}

          {/* Payment Information */}
          {hasPaymentInfo && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full justify-between items-center text-sm border"
                onClick={() => setShowPayment(!showPayment)}>
                <span className="flex items-center">
                  <Banknote className="h-4 w-4 mr-1" />
                  Payment Details
                </span>
                {showPayment ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showPayment && (
                <div className="border rounded-md mt-2 p-3 text-sm bg-slate-50">
                  <div className="grid grid-cols-2 gap-2">
                    {booking.paymentMethod && (
                      <div>
                        <div className="text-slate-500 text-xs">
                          Payment Method
                        </div>
                        <div>{booking.paymentMethod}</div>
                      </div>
                    )}

                    {booking.paymentDate && (
                      <div>
                        <div className="text-slate-500 text-xs">
                          Payment Date
                        </div>
                        <div>{formatDate(booking.paymentDate)}</div>
                      </div>
                    )}

                    {booking.paymentReference && (
                      <div className="col-span-2">
                        <div className="text-slate-500 text-xs">
                          Transaction ID
                        </div>
                        <div className="font-mono text-xs">
                          {booking.paymentReference}
                        </div>
                      </div>
                    )}

                    {booking.amountPaid && (
                      <div>
                        <div className="text-slate-500 text-xs">
                          Amount Paid
                        </div>
                        <div className="text-green-600 font-medium">
                          ₹{booking.amountPaid}
                        </div>
                      </div>
                    )}

                    {booking.balanceDue && (
                      <div>
                        <div className="text-slate-500 text-xs">
                          Balance Due
                        </div>
                        <div className="text-red-600 font-medium">
                          ₹{booking.balanceDue}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Itinerary Preview */}
          {hasItinerary && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full justify-between items-center text-sm border"
                onClick={() => setShowItinerary(!showItinerary)}>
                <span>Tour Itinerary</span>
                {showItinerary ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showItinerary && (
                <div className="border rounded-md mt-2 p-3 max-h-40 overflow-y-auto text-sm">
                  {booking.itinerary.map((day) => (
                    <div
                      key={day._id}
                      className="mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-0 border-slate-100">
                      <div className="font-medium">
                        Day {day.day}: {day.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {day.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            {hasRating ? (
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={`${
                        i < booking.userRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  You rated this tour {booking.userRating}/5
                </span>
              </div>
            ) : hasReviewed ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Review submitted</span>
              </div>
            ) : isPastBooking ? (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() =>
                  openRatingDialog(
                    booking._id,
                    null,
                    "tour",
                    booking.tourName || "Tour Name Not Available"
                  )
                }>
                <Star className="mr-1 h-4 w-4" />
                Rate Your Tour
              </Button>
            ) : (
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Rating available after tour date
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2 justify-between">
            {/* Primary Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Download Ticket Button - only show if confirmed */}
              {isConfirmed && (
                <Button
                  onClick={downloadTicket}
                  size="sm"
                  variant="outline"
                  className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Download Ticket
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TourBookingCard;
