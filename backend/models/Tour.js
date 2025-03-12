import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  activities: { type: String, required: true },
  accommodation: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
});

const tourSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Adventure", required: true},
    price: { type: String, required: true },
    duration: { type: String, required: true },
    groupSize: { type: Number, required: true, min: 1 },
    bookedSlots: { type: Number, default: 0, min: 0 },
    priceOptions: { type: Map, of: String, required: true },
    inclusions: [{ type: String, required: true }],
    exclusions: [{ type: String, required: true }],
    images: [{ type: String }], // Updated to array
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    itinerary: [itinerarySchema]
  }
);

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;