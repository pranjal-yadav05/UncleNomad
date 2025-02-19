import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export default function TourDetailsModal({ tour, isOpen, onClose, onBook }) {
  const [expandedDays, setExpandedDays] = useState({});

  if (!tour) return null;

  const toggleDay = (index) => {
    setExpandedDays(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Dialog  open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tour.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Overview</h4>
              <p className="text-gray-600">{tour.description}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Duration:</span> {tour.duration} days</p>
              <p><span className="font-medium">Group Size:</span> {tour.groupSize}</p>
              <p><span className="font-medium">Location:</span> {tour.location}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Itinerary</h4>
            <div className="space-y-2">
              {tour.itinerary?.map((day, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleDay(index)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Day {day.day}: {day.title}</h5>
                      <svg
                        className={`w-5 h-5 transform transition-transform ${
                          expandedDays[index] ? 'rotate-180' : ''
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                  <div
                    className={`px-4 pb-4 transition-all duration-300 ease-in-out ${
                      expandedDays[index] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-600 mb-3">{day.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">Activities:</span>
                        <p className="text-gray-600 mt-1">{day.activities}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">Accommodation:</span>
                        <p className="text-gray-600 mt极1">{day.accommodation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onBook}>Book Now</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
