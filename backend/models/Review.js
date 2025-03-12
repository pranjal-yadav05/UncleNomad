import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const reviewSchema = new Schema({
  author_name: {
    type: String,
    required: [true, 'Author name is required']
  },
  // No longer storing profile_photo_url as we'll generate avatar from name
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: [true, 'Review text is required']
  },
  source: {
    type: String,
    enum: ['Website', 'Google', 'Yelp', 'Facebook', 'Other'],
    default: 'Website'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Review = model('Review', reviewSchema);

export default Review;