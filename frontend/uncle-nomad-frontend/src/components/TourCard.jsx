import React from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, MapPin } from 'lucide-react';

const TourCard = ({ tour, onClick, handleTourClick }) => {
  const handleButtonClick = (event) => {
    event.stopPropagation();
    handleTourClick(tour);
  };

  return (
    <Card
      className="w-[300px] flex flex-col bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden group"
      onClick={onClick}
    >
      {/* Fixed Image Height */}
      <div className="w-full h-48 flex-shrink-0 overflow-hidden relative">
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

      {/* Content with Fixed Height */}
      <div className="p-4 flex flex-col h-full">
        <h3 className="text-xl font-bold min-h-20 line-clamp-2" style={{ fontFamily: 'Poppins' }}>
          {tour.title}
        </h3>
        <p className="text-gray-600 text-sm min-h-16 line-clamp-3 flex-grow" style={{ fontFamily: 'Poppins' }}>
          {tour.description}
        </p>

        {/* Duration & Location */}
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

        {/* Book Now Button - Stays at Bottom */}
        <Button
          onClick={handleButtonClick}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 py-3 rounded-lg shadow-lg"
          style={{ fontFamily: 'Poppins' }}
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
};

export default TourCard;
