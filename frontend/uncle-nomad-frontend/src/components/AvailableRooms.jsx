import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Bed,
  Users,
  CigaretteOff,
  WineOff,
  Utensils,
  PlusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AvailableRooms({
  availableRooms,
  handleBookNowClick,
  isLoading,
}) {
  const navigate = useNavigate();
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const handleRoomClick = (room) => {
    navigate(`/rooms/${room._id}`, {
      state: { selectedRoom: room },
    });
  };

  return (
    <section className="container mx-auto px-6 min-h-screen flex flex-col justify-center py-24 md:py-32 relative">
      <div className="flex justify-center mb-16">
        <div
          className="text-center relative inline-block"
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          onTouchStart={() => setIsTitleHovered(!isTitleHovered)}
          onTouchEnd={(e) => e.preventDefault()}>
          <h2
            className="text-4xl md:text-5xl font-extrabold inline-block"
            style={{ fontFamily: "Josefin Sans" }}>
            <span
              className={`bg-clip-text text-transparent bg-gradient-to-r ${
                isTitleHovered
                  ? "from-purple-500 to-indigo-600"
                  : "from-indigo-600 to-purple-500"
              } transition-all duration-500`}>
              Our Home Stay in Manali
            </span>
          </h2>
          <span
            className={`block h-1 bg-gradient-to-r from-indigo-600/40 to-purple-500/40 mt-2 mx-auto w-32 transform ${
              isTitleHovered ? "scale-x-100" : "scale-x-0"
            } transition-transform duration-300 origin-center`}></span>
        </div>
      </div>

      {/* Horizontal Scrollable Room Cards */}
      <div className="relative w-full overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 px-4 md:px-12 snap-x flex-grow flex items-center">
        <div className="flex space-x-6 justify-center min-w-max mx-auto">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[340px] h-[500px] flex-shrink-0 snap-start">
                  <Card className="w-full h-full flex flex-col shadow-lg rounded-2xl overflow-hidden bg-gray-200 animate-pulse">
                    <div className="w-full h-56 bg-gray-300" />
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="h-6 bg-gray-400 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-400 rounded w-1/2 mb-3" />
                      <div className="h-4 bg-gray-400 rounded w-3/4 mb-3" />
                      <div className="h-4 bg-gray-400 rounded w-1/2 mb-3" />
                      <div className="h-10 bg-gray-500 rounded w-full mt-6" />
                    </div>
                  </Card>
                </div>
              ))
            : availableRooms.map((room) => (
                <div
                  key={room._id}
                  className="w-[340px] h-[500px] flex-shrink-0 snap-start rounded-2xl">
                  <Card
                    onClick={() => handleRoomClick(room)}
                    className="w-full h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group cursor-pointer bg-white border border-gray-100">
                    {/* Room Image with Overlay */}
                    <div className="w-full h-56 overflow-hidden relative">
                      <img
                        src={room.imageUrl || "/placeholder.svg"}
                        alt={room.type}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all" />
                      <span className="absolute bottom-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                        ₹{room.price}/night
                      </span>
                    </div>

                    {/* Room Details */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Room Type */}
                      <h3 className="text-xl font-bold mb-3 flex items-center text-gray-800">
                        <Bed className="w-6 h-6 mr-2 text-indigo-600" />{" "}
                        {room.type}
                      </h3>

                      {/* Capacity */}
                      <p className="text-gray-700 text-sm flex items-center mb-4">
                        <Users className="w-4 h-4 mr-2 text-indigo-500" />{" "}
                        Capacity: {room.capacity} persons
                      </p>

                      {/* Smoking & Alcohol Policy */}
                      <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
                        {!room.smokingAllowed && (
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
                            <CigaretteOff className="w-4 h-4 text-red-500" />
                            <span className="text-red-700">No Smoking</span>
                          </div>
                        )}
                        {!room.alcoholAllowed && (
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
                            <WineOff className="w-4 h-4 text-red-500" />
                            <span className="text-red-700">No Alcohol</span>
                          </div>
                        )}
                      </div>

                      {/* Meals & Extra Bed Info */}
                      <div className="text-gray-700 text-sm flex flex-wrap gap-3 mb-4">
                        {room.mealIncluded ? (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                            <Utensils className="w-4 h-4 text-green-600" />
                            <span className="text-green-700">
                              Meals Included
                            </span>
                          </div>
                        ) : room.mealPrice > 0 ? (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                            <Utensils className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700">
                              Meals: ₹{room.mealPrice}
                            </span>
                          </div>
                        ) : null}

                        {room.extraBedPrice > 0 && (
                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                            <PlusCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-700">
                              Extra Bed: ₹{room.extraBedPrice}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Children Policy */}
                      {room.childrenAllowed && room.childrenPolicy && (
                        <p className="text-gray-500 text-xs italic bg-gray-50 p-2 rounded-md">
                          {room.childrenPolicy}
                        </p>
                      )}

                      {/* Call to Action Button */}
                      <Button
                        variant="nomad"
                        onClick={(event) => {
                          event.stopPropagation(); // Prevent the Card's onClick from firing
                          handleBookNowClick(room);
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 mt-auto py-3 rounded-lg shadow-md">
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
