import Review from '../models/Review.js';

// Controller methods
export async function getAllReviews(req, res) {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
}

export async function createReview(req, res) {
  try {
    const { author_name, rating, text, source } = req.body;
    
    const newReview = new Review({
      author_name,
      rating,
      text,
      source: source || 'Website'
    });
    
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(400).json({ message: 'Failed to create review', error: error.message });
  }
}

export async function getReviewById(req, res) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Failed to fetch review', error: error.message });
  }
}

export async function updateReview(req, res) {
  try {
    const { author_name, rating, text, source } = req.body;
    const reviewId = req.params.id;
    
    // Fetch the existing review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        author_name,
        rating,
        text,
        source: source || 'Website',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(400).json({ message: 'Failed to update review', error: error.message });
  }
}

export async function deleteReview(req, res) {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Delete the review from the database
    await Review.findByIdAndDelete(reviewId);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
}
