import { MapPin, Star, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../utils/dateUtils";

function TourBookingCard({
  booking,
  getStatusColor,
  openRatingDialog,
  hasReviewForTour,
}) {
  // Check if booking is in the past
  const isPastBooking = new Date(booking.tourDate) < new Date();
  // Check if booking has already been rated
  const hasRating = booking.userRating && booking.userRating > 0;
  // Check if user has already reviewed this tour
  const hasReviewed = hasReviewForTour(booking._id);

  return (
    <Card className="overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center min-w-[150px]">
          {booking.tour?.images && booking.tour.images.length > 0 ? (
            <img
              src={booking.tour.images[0]}
              alt={booking.tour.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
              No Image Available
            </div>
          )}

          <div className="text-center mt-2">
            <h4 className="font-medium">
              {booking.tour?.title || "Tour Name Not Available"}
            </h4>
            {booking.tour?.location && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{booking.tour.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="p-4 sm:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">Tour #{booking._id.slice(-6)}</h3>
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
              <div className="text-sm text-muted-foreground">Tour Date</div>
              <div className="font-medium">{formatDate(booking.tourDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Participants</div>
              <div className="font-medium">{booking.participants || "N/A"}</div>
            </div>
          </div>

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
              <span className="text-sm text-green-500 font-medium">
                Review submitted
              </span>
            ) : isPastBooking ? (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600"
                onClick={() =>
                  openRatingDialog(
                    booking._id,
                    null,
                    "tour",
                    booking.tour?.title || "Tour Name Not Available"
                  )
                }>
                <Star className="mr-1 h-4 w-4" />
                Rate Your Tour
              </Button>
            ) : (
              <span className="text-sm text-gray-500">
                Rating available after tour date
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TourBookingCard;
