import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { formatDate } from "../utils/dateUtils";

export default function TourDatePackageSelector({
  tour,
  onSelectionComplete,
  initialDate = null,
  initialPackage = null,
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPackage, setSelectedPackage] = useState(initialPackage);
  const [showPackages, setShowPackages] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  // Process the dates to ensure they are Date objects
  useEffect(() => {
    if (tour?.availableDates) {
      setAvailableDates(
        tour.availableDates.map((date) => ({
          ...date,
          startDate: new Date(date.startDate),
          endDate: new Date(date.endDate),
        }))
      );
    }
  }, [tour]);

  const handleDateSelect = (date) => {
    // Only allow selection if there are available spots
    if (date.availableSpots > 0) {
      setSelectedDate(date);
      setShowPackages(true);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleContinue = () => {
    if (selectedDate && selectedPackage) {
      onSelectionComplete({
        date: selectedDate,
        package: selectedPackage,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDates.map((date, index) => (
            <Card
              key={index}
              className={`p-4 transition-all ${
                date.availableSpots <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } ${
                selectedDate?.startDate instanceof Date &&
                date.startDate instanceof Date &&
                selectedDate.startDate.getTime() === date.startDate.getTime()
                  ? "border-blue-500 bg-blue-50"
                  : date.availableSpots > 0
                  ? "hover:border-gray-300"
                  : ""
              }`}
              onClick={() => date.availableSpots > 0 && handleDateSelect(date)}>
              <div className="space-y-2">
                <div className="font-medium">
                  {formatDate(date.startDate)} - {formatDate(date.endDate)}
                </div>
                <div
                  className={`text-sm ${
                    date.availableSpots <= 0
                      ? "text-red-500 font-bold"
                      : date.availableSpots <= 3
                      ? "text-orange-500 font-bold"
                      : "text-green-600"
                  }`}>
                  {date.availableSpots <= 0
                    ? "Sold Out"
                    : `${date.availableSpots} spot${
                        date.availableSpots !== 1 ? "s" : ""
                      } available`}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Package Selection */}
      {showPackages && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tour.pricingPackages.map((pkg, index) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transition-all ${
                  selectedPackage?.name === pkg.name
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                }`}
                onClick={() => handlePackageSelect(pkg)}>
                <div className="space-y-2">
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-sm text-gray-600">{pkg.description}</div>
                  <div className="font-semibold">₹{pkg.price}</div>
                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Inclusions:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {pkg.inclusions.map((item, i) => (
                          <li key={i} className="text-gray-600">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedDate && selectedPackage && (
        <div className="flex justify-end">
          <Button
            variant="nomad"
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            Continue to Booking
          </Button>
        </div>
      )}
    </div>
  );
}
