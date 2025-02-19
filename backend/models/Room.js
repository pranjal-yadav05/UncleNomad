import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  totalRooms: {
    type: Number,
    required: true
  },
  amenities: [String],
  mealIncluded: Boolean,
  mealPrice: Number,
  extraBedPrice: Number,
  smokingAllowed: Boolean,
  alcoholAllowed: Boolean,
  childrenAllowed: Boolean,
  childrenPolicy: String,
  beds: [{
    number: Number,
    isOccupied: Boolean
  }]
}, { timestamps: true });

// Method to get available bunk beds
roomSchema.methods.getAvailableBunkBeds = function() {
  return this.beds.filter(bed => !bed.isOccupied);
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
