// Script to update tour collection to new format
// This script converts all tours to match the Indonesia Tour format
// with availableDates and pricingPackages instead of direct date/price fields

// Run this script with MongoDB shell:
// mongo mongodb://localhost:27017/yourDatabaseName update-tours.js

db.tours.find({ availableDates: { $exists: false } }).forEach(function (tour) {
  // Skip tours that already have the new format
  if (tour.availableDates) return;

  // Create availableDates array from startDate and endDate
  let availableDates = [];
  if (tour.startDate && tour.endDate) {
    availableDates.push({
      startDate: tour.startDate,
      endDate: tour.endDate,
      maxGroupSize: tour.groupSize || 6,
      availableSpots: (tour.groupSize || 6) - (tour.bookedSlots || 0),
    });
  }

  // Create pricingPackages from price and priceOptions
  let pricingPackages = [];
  // Add base package
  pricingPackages.push({
    name: "Standard Package",
    description: "Standard tour package",
    price: parseFloat(tour.price),
    features: [],
    inclusions: tour.inclusions || [],
    exclusions: tour.exclusions || [],
  });

  // Add additional packages from priceOptions if they exist
  if (tour.priceOptions && typeof tour.priceOptions === "object") {
    Object.keys(tour.priceOptions).forEach((key) => {
      pricingPackages.push({
        name:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
        description: `${
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
        } option`,
        price: parseFloat(tour.priceOptions[key]),
        features: [],
        inclusions: tour.inclusions || [],
        exclusions: tour.exclusions || [],
      });
    });
  }

  // Convert duration format if needed
  let formattedDuration = tour.duration;
  if (!isNaN(tour.duration)) {
    formattedDuration = `${tour.duration} days/ ${
      parseInt(tour.duration) - 1
    } nights`;
  }

  // Update the tour with new format
  db.tours.updateOne(
    { _id: tour._id },
    {
      $set: {
        duration: formattedDuration,
        availableDates: availableDates,
        pricingPackages: pricingPackages,
      },
      $unset: {
        startDate: "",
        endDate: "",
        bookedSlots: "",
        priceOptions: "",
      },
    }
  );

  print(`Updated tour: ${tour.title}`);
});

print("Tour collection update completed.");
