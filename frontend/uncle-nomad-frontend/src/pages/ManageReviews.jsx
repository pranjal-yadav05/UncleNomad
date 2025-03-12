"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ReviewFormModal from "../modals/ReviewFormModal";
import { Star } from "lucide-react";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../components/ui/table";

export default function ManageReviews() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    author_name: "",
    profile_photo_url: "",
    rating: 5,
    text: "",
    source: "Website"
  });

  const [editMode, setEditMode] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
    setIsModalOpen(false);
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/reviews`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY }
      });
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setIsUploading(true);
  
    try {
      
      const url = editMode ? `${API_URL}/api/reviews/${currentReviewId}` : `${API_URL}/api/reviews`;
      const method = editMode ? "PUT" : "POST";
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY, 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newReview),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save review");
      }
  
      fetchReviews();
      resetForm();
    } catch (error) {
      console.error("❌ Review creation error:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setIsModalOpen(false);
    setNewReview({
      author_name: "",
      profile_photo_url: "",
      rating: 5,
      text: "",
      source: "Website"
    });
    setEditMode(false);
    setCurrentReviewId(null);
  };

  // Helper function to render stars based on rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => {
      if (i < Math.floor(rating)) {
        return <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
      } else if (i < rating) {
        return <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />;
      } else {
        return <Star key={i} className="w-4 h-4 text-gray-300" />;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Reviews</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Customer Reviews</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <Button variant='custom' onClick={() => setIsModalOpen(true)}>Add New Review</Button>
      </div>

      <ReviewFormModal
        isOpen={isModalOpen}
        onClose={resetForm}
        newReview={newReview}
        setNewReview={setNewReview}
        handleAddReview={handleAddReview}
        editMode={editMode}
        isUploading={isUploading}
        setIsModalOpen={setIsModalOpen}
      />

      <h3 className="text-xl font-semibold mb-4 text-gray-800">Existing Reviews</h3>
      <Card>
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Review Text</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review._id} className="hover:bg-gray-50">
                <TableCell>
                  {review.profile_photo_url ? (
                    <img
                      src={review.profile_photo_url}
                      alt={review.author_name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{review.author_name}</TableCell>
                <TableCell>
                  <div className="flex">
                    {renderStars(review.rating)}
                    <span className="ml-1 text-sm">({review.rating})</span>
                  </div>
                </TableCell>
                <TableCell>{review.source}</TableCell>
                <TableCell className="max-w-[300px] truncate">{review.text}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setNewReview({
                        author_name: review.author_name,
                        profile_photo_url: review.profile_photo_url || "",
                        rating: review.rating,
                        text: review.text,
                        source: review.source
                      });
                      setEditMode(true);
                      setCurrentReviewId(review._id);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this review?")) {
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${API_URL}/api/reviews/${review._id}`, {
                            method: "DELETE",
                            headers: {
                              "x-api-key": process.env.REACT_APP_API_KEY,
                              "Authorization": `Bearer ${token}`
                            }
                          });
                          if (response.ok) fetchReviews();
                        } catch (error) {
                          console.error("Error deleting review:", error);
                          setError("Failed to delete review");
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}