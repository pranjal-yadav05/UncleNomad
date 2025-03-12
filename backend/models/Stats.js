import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const StatsSchema = new Schema({
  destinations: {
    type: String,
    required: true,
  },
  tours: {
    type: String,
    required: true,
  },
  travellers: {
    type: String,
    required: true,
  },
  ratings: {
    type: String,
    required: true,
  },
  // Optionally, you can add a timestamp for when the data was created/updated
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Stats = model('Stats', StatsSchema);

export default Stats;
