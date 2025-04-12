// MongoDB Shell Script for direct database updates
// Run with: mongo mongodb://your-connection-string/database update-tours-mongodb.js

// Sample tours update for MongoDB shell

// First, check how many tours need to be updated
let toursToUpdate = db.tours
  .find({
    $or: [
      { availableDates: { $exists: false } },
      { availableDates: { $size: 0 } },
    ],
  })
  .count();

print(`Found ${toursToUpdate} tours to update to the new format.`);

// Update each tour that doesn't have availableDates field or has an empty array
db.tours
  .find({
    $or: [
      { availableDates: { $exists: false } },
      { availableDates: { $size: 0 } },
    ],
  })
  .forEach((tour) => {
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
    if (tour.price) {
      pricingPackages.push({
        name: "Standard Package",
        description: "Standard tour package",
        price: parseFloat(tour.price),
        features: [],
        inclusions: [],
        exclusions: [],
      });
    }

    // Add additional packages from priceOptions if they exist
    if (tour.priceOptions && Object.keys(tour.priceOptions).length > 0) {
      Object.keys(tour.priceOptions).forEach((key) => {
        // Convert camelCase to Title Case with spaces
        let formattedName = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());

        pricingPackages.push({
          name: formattedName,
          description: `${formattedName} option`,
          price: parseFloat(tour.priceOptions[key]),
          features: [],
          inclusions: [],
          exclusions: [],
        });
      });
    }

    // Format duration if it's just a number
    let formattedDuration = tour.duration;
    if (!isNaN(tour.duration)) {
      formattedDuration = `${tour.duration} days/ ${
        parseInt(tour.duration) - 1
      } nights`;
    }

    // Update document
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

// Validation check
let remainingToUpdate = db.tours
  .find({
    $or: [
      { availableDates: { $exists: false } },
      { availableDates: { $size: 0 } },
    ],
  })
  .count();

print(`Remaining tours to update: ${remainingToUpdate}`);
if (remainingToUpdate === 0) {
  print("✅ All tours have been successfully updated to the new format!");
} else {
  print("⚠️ Some tours couldn't be updated. Please check the logs.");
}
