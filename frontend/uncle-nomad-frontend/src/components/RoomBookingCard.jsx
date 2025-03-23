import {
  MapPin,
  Star,
  CheckCircle,
  Download,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../utils/dateUtils";
import { toast } from "react-hot-toast";
import { generateRoomTicketTemplate } from "../templates/roomTicketTemplate";
import { formatDateDDMMYYYY } from "../templates/dateUtils";

function RoomBookingCard({
  booking,
  getStatusColor,
  openRatingDialog,
  hasReviewForRoom,
}) {
  // Calculate duration of stay in days
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const durationInDays = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  // Add the downloadTicket function
  const downloadTicket = () => {
    try {
      // Debug: Log booking object to see price fields
      console.log("Booking data for ticket:", {
        _id: booking._id,
        totalAmount: booking.totalAmount,
        totalPrice: booking.totalPrice,
        roomsInfo: booking.rooms.map((room) => ({
          price: room.price,
          pricePerNight: room.pricePerNight,
          subtotal: room.subtotal,
          numberOfNights: room.numberOfNights,
        })),
      });

      // Generate the ticket HTML using the template
      const ticketHtml = generateRoomTicketTemplate(
        booking,
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
      console.error("Error generating ticket:", error);
      toast.error(`Error generating ticket: ${error.message}`);
    }
  };

  return (
    <Card className="overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center min-w-[150px]">
          {booking.rooms.length > 0 && booking.rooms[0].images?.length > 0 ? (
            <img
              src={booking.rooms[0].images[0]}
              alt={booking.rooms[0].roomType}
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
              No Image Available
            </div>
          )}

          <div className="text-center mt-2">
            <h4 className="font-medium">
              {booking.rooms.map((r) => r.roomType).join(", ")}
            </h4>
            {booking.location && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{booking.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="p-4 sm:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold truncate">
                Booking #{booking._id.slice(-6)}
              </h3>
              <Badge
                className={getStatusColor(booking.status)}
                variant="outline">
                {booking.status}
              </Badge>
            </div>
            {booking.totalAmount && (
              <div className="text-right">
                <span className="font-semibold">₹{booking.totalAmount}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between mt-3">
            <div className="mb-2 sm:mb-0">
              <div className="text-sm text-muted-foreground">Check-in</div>
              <div className="font-medium">{formatDate(booking.checkIn)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-out</div>
              <div className="font-medium">{formatDate(booking.checkOut)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">
                {durationInDays} night{durationInDays !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Additional booking details */}
          <div className="mt-3 mb-3 text-sm text-gray-600">
            <div className="flex items-center mt-1">
              <Users className="h-3 w-3 mr-1" />
              <span>
                Guests: {booking.numberOfGuests || booking.guests || 1}
              </span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium mb-3 flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Rate Your Stay
            </h4>
            <div className="space-y-3">
              {booking.rooms.map((room, index) => {
                const hasCheckedOut = new Date(booking.checkOut) < new Date();
                const hasRating = room.userRating && room.userRating > 0;
                const hasReviewed = hasReviewForRoom(booking._id, room.roomId);

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="p-3 flex justify-between items-center">
                      <div className="font-medium">{room.roomType}</div>

                      {hasRating ? (
                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < room.userRating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                } mr-0.5`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium ml-1">
                            {room.userRating}/5
                          </span>
                        </div>
                      ) : hasReviewed ? (
                        <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-sm font-medium">
                            Review submitted
                          </span>
                        </div>
                      ) : (
                        hasCheckedOut && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                            onClick={() =>
                              openRatingDialog(
                                booking._id,
                                room.roomId,
                                "room",
                                room.roomType
                              )
                            }>
                            <Star className="h-3 w-3 mr-1.5" />
                            Rate Room
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Download Ticket Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-3"
              onClick={downloadTicket}>
              <Download className="h-3 w-3 mr-1" />
              Download Ticket
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default RoomBookingCard;
