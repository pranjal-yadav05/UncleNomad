// models/Media.js
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 5
  },
  order: {
    type: Number,
    default: 0
  },
  width: {
    type: Number,
    default: null
  },
  height: {
    type: Number,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Media = mongoose.model('Media', mediaSchema);

export default Media;