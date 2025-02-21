import { Card } from "./ui/card";
import { Button } from "./ui/button";

export default function TourCard({ tour, onClick, handleBookNowClick }) {
  // Handle the button click to prevent the modal open of the card.
  const handleButtonClick = (event) => {
    event.stopPropagation(); // Prevent the onClick from being triggered when "Book Now" is clicked.
    handleBookNowClick(); // Trigger the booking modal to open
  };

  return (
    <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <h3 className="text-xl font-semibold">{tour.title}</h3>
      <p className="text-gray-600 line-clamp-2">{tour.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium">₹{tour.price}</span>
        <span className="text-sm text-gray-500">{tour.duration} days</span>
        <Button onClick={handleButtonClick} variant="custom">Book Now</Button>
      </div>
    </Card>
  );
}
