import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  activities: { type: String, required: true },
  accommodation: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true } // Ensuring correct ObjectId format
});

const tourSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    duration: { type: String, required: true },
    groupSize: { type: Number, required: true, min: 1 },
    bookedSlots: { type: Number, default: 0, min: 0 },

    // ✅ Corrected to store multiple price options as an object
    priceOptions: {
      type: Map,
      of: String,
      required: true
    },

    inclusions: [{ type: String, required: true }],
    exclusions: [{ type: String, required: true }],
    image: { type: String },
    location: { type: String, required: true },

    // ✅ Correctly storing dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    itinerary: [itinerarySchema] // Using a sub-schema for itinerary
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Virtual property for available slots
tourSchema.virtual("availableSlots").get(function () {
  return Math.max(0, this.groupSize - this.bookedSlots);
});

// ✅ Ensure `bookedSlots` does not exceed `groupSize`
tourSchema.pre("save", function (next) {
  if (this.bookedSlots > this.groupSize) {
    next(new Error("Booked slots cannot exceed group size"));
  } else {
    next();
  }
});

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
