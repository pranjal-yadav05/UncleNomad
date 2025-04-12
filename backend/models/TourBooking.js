import mongoose from "mongoose";

const tourBookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: true,
  },
  selectedDate: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  selectedPackage: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  groupSize: {
    type: Number,
    required: true,
    min: 1,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  specialRequests: String,
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    default: "PENDING",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "INITIATED", "PAID"],
    default: "PENDING",
  },
  paymentReference: String,
  paymentDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save hook to update the updatedAt field
tourBookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const TourBooking = mongoose.model("TourBooking", tourBookingSchema);

export default TourBooking;
