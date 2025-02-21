import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  }
});

const Query = mongoose.model('Query', querySchema);
export default Query;
