import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  duration: { type: String, required: true },
  groupSize: { type: String, required: true },
  image: { type: String },

  location: { type: String, required: true },
  itinerary: [{
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    activities: { type: String, required: true },
    accommodation: { type: String, required: true }
  }]

});

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
