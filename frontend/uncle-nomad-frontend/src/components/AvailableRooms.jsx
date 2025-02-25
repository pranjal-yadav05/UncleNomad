import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Bed, Users } from 'lucide-react';

export default function AvailableRooms({ availableRooms, handleBookNowClick }) {
  return (
    <section className="container mx-auto px-4 py-16 relative">
      <h2 className="text-4xl font-bold mb-8 text-center">Rooms We Offer</h2>
      
      <div className="relative flex space-x-6 overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 px-4 md:px-12">
        {availableRooms.map((room) => (
          <div key={room.id} className="w-[300px] h-[420px] flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
            <Card className="w-full h-full flex flex-col bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer">
              <div className="w-full h-48 overflow-hidden relative">
                <img
                  src={room.imageUrl || "/placeholder.svg"}
                  alt={room.type}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 bg-white/90 text-primary px-2 py-1 rounded-full text-sm font-semibold">
                  ₹{room.price}/night
                </span>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2 line-clamp-1 flex items-center">
                  <Bed className="w-5 h-5 mr-2" /> {room.type}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 flex items-center mb-4">
                  <Users className="w-4 h-4 mr-1" /> Capacity: {room.capacity} persons
                </p>
                
                <ul className="text-gray-500 text-xs line-clamp-3 mb-4 flex-grow">
                  {room.amenities.map((amenity, index) => (
                    <li key={index} className="list-disc list-inside">{amenity}</li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handleBookNowClick(room)} 
                  variant="custom" 
                  className="w-full group-hover:text-white transition-colors duration-300">
                  Check Availability
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
