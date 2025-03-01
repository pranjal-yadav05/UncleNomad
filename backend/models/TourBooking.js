import mongoose from 'mongoose';

const tourBookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  groupSize: {
    type: Number,
    required: true,
    min: 1
  },
  bookingDate: {
    type: Date,
    required: true
  },
  guestName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  specialRequests: String,
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED','INITIATED'],
    default: 'PENDING'
  },
  paymentReference: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TourBooking = mongoose.model('TourBooking', tourBookingSchema);

export default TourBooking;
