import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { formatDate } from "../utils/dateUtils";

export default function TourDetailsModal({ tour, isOpen, onClose, onBook }) {
  const [expandedDays, setExpandedDays] = useState({});
  const [showInclusions, setShowInclusions] = useState(false);
  const [showExclusions, setShowExclusions] = useState(false);
  const [showPriceOptions, setShowPriceOptions] = useState(false);

  if (!tour) return null;

  const toggleDay = (index) => {
    setExpandedDays((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{tour.title}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mb-4">
          <img
            src={tour.image}
            alt={tour.title}
            className="max-w-full h-auto rounded"
          />
        </div>

        <div className="space-y-6">
          {/* Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Overview</h4>
              <p className="text-gray-600">{tour.description}</p>
              <p className="text-gray-600">
                <span className="font-medium">Location:</span> {tour.location}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Start Date:</span>{" "}
                {formatDate(tour.startDate)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">End Date:</span>{" "}
                {formatDate(tour.endDate)}
              </p>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-2">
              <p>
                <span className="font-medium">Duration:</span> {tour.duration}{" "}
                days
              </p>
              <p>
                <span className="font-medium">Group Size:</span>{" "}
                {tour.groupSize}
              </p>
              <p>
                <span className="font-medium">Available Slots:</span>{" "}
                {tour.availableSlots}
              </p>
            </div>
          </div>

          {/* Pricing Options Dropdown */}

          {tour.priceOptions && (
            <div className="border rounded-lg">
              <button
                className="w-full text-left p-3 font-semibold bg-gray-100"
                onClick={() => setShowPriceOptions(!showPriceOptions)}>
                Pricing Options
              </button>
              {showPriceOptions && (
                <div className="p-3">
                  <ul className="text-gray-600">
                    {tour.priceOptions &&
                      Object.entries(tour.priceOptions).map(
                        ([option, price]) => (
                          <li key={option}>
                            <span className="font-medium">{option}:</span> ₹
                            {price}
                          </li>
                        )
                      )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Inclusions Dropdown */}
          <div className="border rounded-lg">
            <button
              className="w-full text-left p-3 font-semibold bg-gray-100"
              onClick={() => setShowInclusions(!showInclusions)}>
              Inclusions
            </button>
            {showInclusions && (
              <div className="p-3">
                <ul className="list-disc list-inside text-gray-600">
                  {tour.inclusions?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Exclusions Dropdown */}
          <div className="border rounded-lg">
            <button
              className="w-full text-left p-3 font-semibold bg-gray-100"
              onClick={() => setShowExclusions(!showExclusions)}>
              Exclusions
            </button>
            {showExclusions && (
              <div className="p-3">
                <ul className="list-disc list-inside text-gray-600">
                  {tour.exclusions?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Itinerary Section */}
          <div>
            <h4 className="font-semibold mb-4">Itinerary</h4>
            <div className="space-y-2">
              {tour.itinerary?.map((day, index) => (
                <div
                  key={day._id}
                  className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleDay(index)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">
                        Day {day.day}: {day.title}
                      </h5>
                      <svg
                        className={`w-5 h-5 transform transition-transform ${
                          expandedDays[index] ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                  {expandedDays[index] && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <p className="text-gray-600 mb-3">{day.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <span className="font-medium">Activities:</span>
                          <p className="text-gray-600 mt-1">{day.activities}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <span className="font-medium">Accommodation:</span>
                          <p className="text-gray-600 mt-1">
                            {day.accommodation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Booking Button */}
          <div className="flex justify-end">
            <Button onClick={onBook}>Book Now</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
