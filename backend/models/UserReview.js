import mongoose from 'mongoose';

const userReviewSchema = new mongoose.Schema({
  // The user who submitted the review
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  // Can reference either a tour or room booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Type of booking - "tour" or "room"
  bookingType: {
    type: String,
    enum: ['tour', 'room'],
    required: true
  },
  // Reference to the actual tour or room (not just the booking)
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Rating on a scale of 1-5
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Written review
  comment: {
    type: String,
    trim: true
  },
  // Review status for moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  // To store any images uploaded with the review
  images: [String],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userReviewSchema.index({ itemId: 1, bookingType: 1 });
userReviewSchema.index({ userId: 1 });
userReviewSchema.index({ bookingId: 1 });

const UserReview = mongoose.model('UserReview', userReviewSchema);

export default UserReview;