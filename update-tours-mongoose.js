// Node.js script to update tour collection using Mongoose
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/uncleNomad")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// Define schemas
const itinerarySchema = new mongoose.Schema({
  day: Number,
  title: String,
  description: String,
  activities: String,
  accommodation: String,
  _id: mongoose.Schema.Types.ObjectId,
});

const tourSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  category: String,
  duration: String,
  location: String,
  groupSize: Number,
  inclusions: [String],
  exclusions: [String],
  images: [String],
  averageRating: Number,
  reviewCount: Number,
  itinerary: [itinerarySchema],
  availableDates: [
    {
      startDate: Date,
      endDate: Date,
      maxGroupSize: Number,
      availableSpots: Number,
    },
  ],
  pricingPackages: [
    {
      name: String,
      description: String,
      price: Number,
      features: [String],
      inclusions: [String],
      exclusions: [String],
    },
  ],
  // Legacy fields
  startDate: Date,
  endDate: Date,
  bookedSlots: Number,
  priceOptions: mongoose.Schema.Types.Mixed,
  price: String,
});

// Create model
const Tour = mongoose.model("Tour", tourSchema);

async function updateTours() {
  try {
    // Find all tours that don't have availableDates (not converted yet)
    const tours = await Tour.find({ availableDates: { $exists: false } });
    console.log(`Found ${tours.length} tours to update`);

    for (const tour of tours) {
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
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, " $1"),
            description: `${
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, " $1")
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
      await Tour.updateOne(
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

      console.log(`Updated tour: ${tour.title}`);
    }

    console.log("Tour collection update completed.");
  } catch (error) {
    console.error("Error updating tours:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the update function
updateTours();
