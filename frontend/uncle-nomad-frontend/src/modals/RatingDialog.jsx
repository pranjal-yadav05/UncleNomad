import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../components/ui/use-toast";

const RatingDialog = ({ isOpen, onClose, bookingDetails, onSubmitRating }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast({
        title: "Rating required",
        description: "Please select a star rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the parent component's onSubmitRating function
      await onSubmitRating({
        bookingId: bookingDetails.bookingId,
        bookingType: bookingDetails.bookingType,
        roomId:
          bookingDetails.bookingType === "room" ? bookingDetails.roomId : null,
        rating,
        review,
      });

      // Reset form
      setRating(0);
      setReview("");

      // Close dialog
      onClose();

      // Show success message
      showToast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
      console.error("Rating submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleRatingHover = (value) => {
    setHoverRating(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Rate your {bookingDetails.bookingType === "room" ? "Stay" : "Tour"}
          </DialogTitle>
          <DialogDescription>
            {bookingDetails.bookingType === "room"
              ? `How was your stay at ${
                  bookingDetails.itemName || "our accommodation"
                }?`
              : `How was your experience with the ${
                  bookingDetails.itemName || "tour"
                }?`}
          </DialogDescription>
        </DialogHeader>

        {/* Star Rating */}
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="rating">Your Rating</Label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => handleRatingHover(star)}
                  onMouseLeave={() => handleRatingHover(0)}>
                  <Star
                    size={32}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="review">Your Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            variant="nomad">
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
