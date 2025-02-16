import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Deluxe', 'Super Deluxe', 'Bunk Beds (Shared)']
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  capacity: { 
    type: Number, 
    required: true,
    min: 1
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{ type: String }],
  mealIncluded: {
    type: Boolean,
    default: false
  },
  mealPrice: {
    type: Number,
    default: 2000
  },
  extraBedPrice: {
    type: Number,
    default: 500
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  alcoholAllowed: {
    type: Boolean,
    default: false
  },
  childrenAllowed: {
    type: Boolean,
    default: true
  },
  childrenPolicy: {
    type: String,
    default: '0 to 6 years free, 6 to 12 years children beds'
  }
});



const propertySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  rating: { type: String, required: true },
  amenities: [{ type: String }],
  rooms: [roomSchema],
  totalCapacity: {
    type: Number,
    required: true,
    min: 0
  },
  checkInTime: {
    type: String,
    default: '13:00'
  },
  checkOutTime: {
    type: String,
    default: '10:30'
  },
  smokingPolicy: {
    type: String,
    default: 'Not Allowed'
  },
  alcoholPolicy: {
    type: String,
    default: 'Not Allowed'
  },
  petPolicy: {
    type: String,
    default: 'Not Allowed'
  },
  cancellationPolicy: {
    type: String,
    required: true
  },
  houseRules: [String],
  tourGuideAvailable: {
    type: Boolean,
    default: false
  }
});



const Property = mongoose.model('Property', propertySchema);

export default Property;
