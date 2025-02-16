import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guestName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
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
  numberOfGuests: {
    type: Number,
    required: true
  },
  numberOfChildren: {
    type: Number,
    default: 0
  },
  mealIncluded: {
    type: Boolean,
    default: false
  },
  extraBeds: {
    type: Number,
    default: 0
  },
  specialRequests: {
    type: String
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  bunkBedNumber: {
    type: Number,
    required: function() {
      return this.roomType === 'Dorm'
    }
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

// Pre-save hook to validate bunk bed number for dorm bookings
bookingSchema.pre('save', async function(next) {
  if (this.bunkBedNumber) {
    const room = await mongoose.model('Room').findById(this.roomId);
    if (room && room.type === 'Dorm') {
      const bed = room.bunkBeds.find(b => b.number === this.bunkBedNumber);
      if (!bed || bed.isOccupied) {
        return next(new Error('Selected bunk bed is not available'));
      }
    }
  }
  next();
});

// Post-save hook to mark bunk bed as occupied
bookingSchema.post('save', async function(doc) {
  if (doc.bunkBedNumber) {
    const room = await mongoose.model('Room').findById(doc.roomId);
    if (room && room.type === 'Dorm') {
      await room.reserveBunkBed(doc.bunkBedNumber);
      await room.save();
    }
  }
});

// Post-remove hook to release bunk bed
bookingSchema.post('remove', async function(doc) {
  if (doc.bunkBedNumber) {
    const room = await mongoose.model('Room').findById(doc.roomId);
    if (room && room.type === 'Dorm') {
      await room.releaseBunkBed(doc.bunkBedNumber);
      await room.save();
    }
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
