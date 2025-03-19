import { MapPin, Star, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";


function RoomBookingCard({
  booking,
  getStatusColor,
  formatDate,
  openRatingDialog,
  hasReviewForRoom,
}) {
  return (
    <Card className="overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center min-w-[150px]">
          {booking.rooms.length > 0 && booking.rooms[0].images.length > 0 ? (
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
                <span className="font-semibold">${booking.totalAmount}</span>
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
          </div>

          {/* Rating Section */}
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
        </div>
      </div>
    </Card>
  );
}

export default RoomBookingCard;
