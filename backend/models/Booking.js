import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    rooms: [
      {
        roomId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
          required: true,
        },
        roomName: String,
        roomType: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: Number,
        capacity: Number,
        numberOfNights: Number,
        subtotal: Number,
      },
    ],
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
    },
    specialRequests: String,
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    paytmOrderId: {
      type: String,
      unique: true,
    },
    paymentReference: String,
    paymentDate: Date,
    paymentAmount: Number,
    paymentError: String,
    paymentErrorCode: String,
    numberOfChildren: {
      type: Number,
      default: 0,
    },
    mealIncluded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
