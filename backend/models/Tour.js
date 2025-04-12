import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  activities: { type: String, required: true },
  accommodation: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
});

const tourSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "Adventure", required: true },
  duration: { type: String, required: true },
  location: { type: String, required: true },
  groupSize: { type: Number, required: true, min: 1 },
  inclusions: [{ type: String, required: true }],
  exclusions: [{ type: String, required: true }],
  images: [{ type: String }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  itinerary: [itinerarySchema],
  // New fields for multiple dates and pricing packages
  availableDates: [
    {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      maxGroupSize: { type: Number, required: true, min: 1 },
      availableSpots: { type: Number, required: true, min: 0 },
    },
  ],
  pricingPackages: [
    {
      name: { type: String, required: true },
      description: { type: String },
      price: { type: Number, required: true, min: 0 },
      features: [{ type: String }],
      inclusions: [{ type: String }],
      exclusions: [{ type: String }],
    },
  ],
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
