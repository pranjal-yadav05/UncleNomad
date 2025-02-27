import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Bed, Users, CigaretteOff, WineOff, Utensils, PlusCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function AvailableRooms({ availableRooms, handleBookNowClick }) {
  const navigate = useNavigate();

  const handleRoomClick = (room) => {
    // Use navigate to go to the TourDetailsPage, passing the tour's data via state
    navigate(`/rooms/${room._id}`, {
      state: { selectedRoom: room } // Pass the selected tour via state
    });
  };

  return (
    <section className="container mx-auto px-6 py-16 relative">
      <h2 className="text-5xl font-extrabold mb-10 text-center text-gray-900 dark:text-white">
        Rooms We Offer
      </h2>

      {/* Horizontal Scrollable Room Cards */}
      <div className="relative w-full overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 px-4 md:px-12 snap-x">
        <div className="flex space-x-6 justify-center min-w-max mx-auto">

        {availableRooms.map((room) => (
          <div className="w-[340px] h-[500px] flex-shrink-0 snap-start">
            <Card onClick={()=>handleRoomClick(room)} className="w-full h-full flex flex-col bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group cursor-pointer">
              
              {/* Room Image with Overlay */}
              <div className="w-full h-56 overflow-hidden relative rounded-t-2xl">
                <img
                  src={room.imageUrl || "/placeholder.svg"}
                  alt={room.type}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-all" />
                <span className="absolute bottom-4 left-4 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                  ₹{room.price}/night
                </span>
              </div>

              {/* Room Details */}
              <div className="p-6 flex flex-col flex-grow bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-80 rounded-b-2xl">
                
                {/* Room Type */}
                <h3 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
                  <Bed className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-400" /> {room.type}
                </h3>

                {/* Capacity */}
                <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center mb-3">
                  <Users className="w-4 h-4 mr-1 text-blue-400" /> Capacity: {room.capacity} persons
                </p>

                {/* Smoking & Alcohol Policy */}
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 text-xs mb-3">
                  {!room.smokingAllowed && (
                    <div className="flex items-center gap-1">
                      <CigaretteOff className="w-4 h-4 text-red-500" />
                      <span>No Smoking</span>
                    </div>
                  )}
                  {!room.alcoholAllowed && (
                    <div className="flex items-center gap-1">
                      <WineOff className="w-4 h-4 text-red-500" />
                      <span>No Alcohol</span>
                    </div>
                  )}
                </div>

                {/* Meals & Extra Bed Info */}
                <div className="text-gray-700 dark:text-gray-300 text-sm flex flex-wrap gap-3 mb-4">
                  {room.mealIncluded ? (
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4 text-green-500" />
                      <span>Meals Included</span>
                    </div>
                  ) : room.mealPrice > 0 ? (
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <span>Meals: ₹{room.mealPrice}</span>
                    </div>
                  ) : null}

                  {room.extraBedPrice > 0 && (
                    <div className="flex items-center gap-1">
                      <PlusCircle className="w-4 h-4 text-blue-500" />
                      <span>Extra Bed: ₹{room.extraBedPrice}</span>
                    </div>
                  )}
                </div>

                {/* Children Policy */}
                {room.childrenAllowed && room.childrenPolicy && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                    {room.childrenPolicy}
                  </p>
                )}

                {/* Call to Action Button */}
                <Button 
                  onClick={(event) => {
                    event.stopPropagation(); // Prevent the Card's onClick from firing
                    handleBookNowClick(room);
                  }} 
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg transition-all duration-500 hover:scale-105 hover:opacity-90 mt-4"
                >
                  Check Availability
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
