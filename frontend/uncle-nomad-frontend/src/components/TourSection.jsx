import { useState } from "react";
import TourCard from "./TourCard";
import TourDetailsModal from "./TourDetailsModal";
import TourBookingModal from "./TourBookingModal";

const TourSection = ({ tours, setIsBookingModalOpen, isBookingModalOpen }) => {
  const [selectedTour, setSelectedTour] = useState(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  const handleBookNowClick = () => {
    setIsTourModalOpen(false);  // Close the tour details modal
    setIsBookingModalOpen(true); // Open the booking modal
  };

  return (
    <div id="tours" className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8">Curated Experiences</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map((tour) => (
          <TourCard
            key={tour._id}
            tour={tour}
            handleBookNowClick={handleBookNowClick}
            setIsBookingModalOpen={setIsBookingModalOpen}
            onClick={() => {
              setSelectedTour(tour);
              setIsTourModalOpen(true); // Open the tour details modal
            }}
          />
        ))}
      </div>

      {/* Tour Details Modal */}
      <TourDetailsModal
        tour={selectedTour}
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onBook={handleBookNowClick} // Handle Book Now click
      />

      {/* Tour Booking Modal */}
      <TourBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedTour={selectedTour}
      />
    </div>
  );
};

export default TourSection;
