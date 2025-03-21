"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ReviewFormModal from "../modals/ReviewFormModal";
import { Star, Filter } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  const [userReviews, setUserReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newReview, setNewReview] = useState({
    author_name: "",
    profile_photo_url: "",
    rating: 5,
    text: "",
    source: "Website",
  });

  const [editMode, setEditMode] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("all");

  useEffect(() => {
    fetchReviews();
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    fetchUserReviews(currentPage);
  }, [currentPage]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/reviews`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY },
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

  const fetchUserReviews = async (page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/userreviews?page=${page}&limit=10`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setUserReviews(data.reviews);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const url = editMode
        ? `${API_URL}/api/reviews/${currentReviewId}`
        : `${API_URL}/api/reviews`;
      const method = editMode ? "PUT" : "POST";
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const handleUpdateUserReviewStatus = async (reviewId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/userreviews/${reviewId}/status`,
        {
          method: "PATCH",
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update review status");
      }

      fetchUserReviews();
    } catch (error) {
      console.error("Error updating review status:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeleteUserReview = async (reviewId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user review? This action cannot be undone."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/userreviews/${reviewId}`, {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete user review");
        }

        fetchUserReviews();
      } catch (error) {
        console.error("Error deleting user review:", error);
        setError(error.message);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setNewReview({
      author_name: "",
      profile_photo_url: "",
      rating: 5,
      text: "",
      source: "Website",
    });
    setEditMode(false);
    setCurrentReviewId(null);
  };

  // Helper function to render stars based on rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => {
      if (i < Math.floor(rating)) {
        return (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i < rating) {
        return (
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        );
      } else {
        return <Star key={i} className="w-4 h-4 text-gray-300" />;
      }
    });
  };

  // Filter user reviews based on selected filters
  const filteredUserReviews = userReviews.filter((review) => {
    if (statusFilter !== "all" && review.status !== statusFilter) return false;
    if (bookingTypeFilter !== "all" && review.bookingType !== bookingTypeFilter)
      return false;
    return true;
  });

  if (isLoading && reviews.length === 0 && userReviews.length === 0) {
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Reviews</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Tabs defaultValue="testimonials">
        <TabsList className="mb-6 flex justify-center bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="testimonials"
            className="data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2 rounded-md">
            Testimonials
          </TabsTrigger>
          <TabsTrigger
            value="userReviews"
            className="data-[state=active]:bg-white data-[state=active]:text-black px-6 py-2 rounded-md">
            User Reviews
          </TabsTrigger>
        </TabsList>
        {/* Testimonials Tab */}
        <TabsContent value="testimonials">
          <div className="mb-8">
            <Button variant="custom" onClick={() => setIsModalOpen(true)}>
              Add New Testimonial
            </Button>
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

          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Existing Testimonials
          </h3>
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
                    <TableCell className="font-medium">
                      {review.author_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {renderStars(review.rating)}
                        <span className="ml-1 text-sm">({review.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>{review.source}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {review.text}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setNewReview({
                            author_name: review.author_name,
                            profile_photo_url: review.profile_photo_url || "",
                            rating: review.rating,
                            text: review.text,
                            source: review.source,
                          });
                          setEditMode(true);
                          setCurrentReviewId(review._id);
                          setIsModalOpen(true);
                        }}>
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        className="text-red-500"
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this testimonial?"
                            )
                          ) {
                            try {
                              const token = localStorage.getItem("token");
                              const response = await fetch(
                                `${API_URL}/api/reviews/${review._id}`,
                                {
                                  method: "DELETE",
                                  headers: {
                                    "x-api-key": process.env.REACT_APP_API_KEY,
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );
                              if (response.ok) fetchReviews();
                            } catch (error) {
                              console.error("Error deleting review:", error);
                              setError("Failed to delete review");
                            }
                          }
                        }}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* User Reviews Tab */}
        <TabsContent value="userReviews">
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Filter by type:</span>
              <Select
                value={bookingTypeFilter}
                onValueChange={setBookingTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Booking Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tour">Tours</SelectItem>
                  <SelectItem value="room">Rooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Customer Reviews
          </h3>
          <Card>
            <Table className="border border-gray-300">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>User</TableHead>
                  <TableHead>Booking Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserReviews.length > 0 ? (
                  filteredUserReviews.map((review) => (
                    <TableRow key={review._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {review.userName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            review.bookingType === "tour"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                          {review.bookingType === "tour" ? "Tour" : "Room"}
                        </span>
                      </TableCell>
                      <TableCell>{review.itemName}</TableCell>
                      <TableCell>
                        <div className="flex">
                          {renderStars(review.rating)}
                          <span className="ml-1 text-sm">
                            ({review.rating})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            review.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : review.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {review.status.charAt(0).toUpperCase() +
                            review.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {review.comment}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2">
                          {review.status !== "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() =>
                                handleUpdateUserReviewStatus(
                                  review._id,
                                  "approved"
                                )
                              }>
                              Approve
                            </Button>
                          )}

                          {review.status !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              onClick={() =>
                                handleUpdateUserReviewStatus(
                                  review._id,
                                  "rejected"
                                )
                              }>
                              Reject
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUserReview(review._id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-20 text-center text-gray-500">
                      No user reviews found with the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}>
                  Previous
                </Button>

                <span className="px-4 py-2 border rounded">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
