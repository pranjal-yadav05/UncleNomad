import React from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, MapPin } from 'lucide-react';

const TourCard = ({ tour, onClick, handleBookNowClick, setSelectedTour, handleTourClick }) => {
  const handleButtonClick = (event) => {
    event.stopPropagation();
    // setSelectedTour(tour);
    // handleBookNowClick();
    handleTourClick(tour)
  };

  return (
    <Card
      className="w-[300px] h-[400px] flex flex-col bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden group"
      onClick={onClick}
    >
      <div className="w-full h-48 overflow-hidden relative">
        <img
          src={tour.images[0] || "/placeholder.svg"}
          alt={tour.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-3 left-3 bg-white/90 text-primary px-2 py-1 rounded-full text-sm font-semibold">
          ₹{tour.price}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{tour.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">{tour.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{tour.duration} days</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{tour.location}</span>
          </div>
        </div>

        <Button onClick={handleButtonClick} className="w-full group-hover:bg-primary group-hover:text-black transition-colors duration-300">
          Book Now
        </Button>
      </div>
    </Card>
  );
};

export default TourCard;
