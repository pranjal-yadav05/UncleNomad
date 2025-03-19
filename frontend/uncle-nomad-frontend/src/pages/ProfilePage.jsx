"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { CalendarDays, LogOut, MapPin, User, Compass } from "lucide-react";
import TourBookingCard from "../components/TourBookingCard";
import Footer from "../components/Footer";
import RoomBookingCard from "../components/RoomBookingCard";
import Header from "../components/Header";
import { Star } from "lucide-react";
import RatingDialog from "../modals/RatingDialog";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roomBookings, setRoomBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [currentBookingToRate, setCurrentBookingToRate] = useState({
    bookingId: "",
    roomId: "",
    bookingType: "", // "room" or "tour"
    itemName: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    if (!authToken) {
      navigate("/login"); // Redirect if not authenticated
    } else {
      setUser({ name: userName || "", email: userEmail || "" });
      fetchRoomBookings(authToken);
      fetchTourBookings(authToken);
      fetchUserReviews(authToken);
    }
  }, [navigate]);

  const fetchUserReviews = async (authToken) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/userreviews/user`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY || "",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user reviews");
      }

      const data = await response.json();
      setUserReviews(data);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchRoomBookings = async (authToken) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/bookings/user-bookings`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY || "",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch room bookings");
      }

      const data = await response.json();
      // Sort bookings with newest (by checkIn date) first
      const sortedBookings = data.sort(
        (a, b) => new Date(b.checkIn) - new Date(a.checkIn)
      );
      setRoomBookings(sortedBookings);
    } catch (error) {
      console.error("Error fetching room bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTourBookings = async (authToken) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tours/user-tour-booking`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY || "",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tour bookings");
      }

      const data = await response.json();

      // Sort bookings with newest (by tourDate) first
      const sortedBookings = data.sort(
        (a, b) => new Date(b.tourDate) - new Date(a.tourDate)
      );
      setTourBookings(sortedBookings);
    } catch (error) {
      console.error("Error fetching tour bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("token");
    navigate("/"); // Redirect to homepage
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const openRatingDialog = (bookingId, roomId, bookingType, itemName) => {
    setCurrentBookingToRate({
      bookingId,
      roomId,
      bookingType,
      itemName,
    });
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = async (ratingData) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication required");
    }

    const endpoint =
      ratingData.bookingType === "room"
        ? `${process.env.REACT_APP_API_URL}/api/userreviews/room`
        : `${process.env.REACT_APP_API_URL}/api/userreviews/tour`;

    try {
      console.log("Submitting review:", JSON.stringify({
        bookingId: ratingData.bookingId,
        roomId: ratingData.roomId,
        rating: ratingData.rating,
        review: ratingData.review,
      }));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bookingId: ratingData.bookingId,
          roomId: ratingData.roomId || null,
          rating: ratingData.rating,
          review: ratingData.review,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      const newReview = await response.json();

      // Add the new review to our userReviews state
      setUserReviews((prevReviews) => [...prevReviews, newReview.review]);

      // Update the relevant booking state
      if (ratingData.bookingType === "room") {
        setRoomBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking._id === ratingData.bookingId) {
              return {
                ...booking,
                rooms: booking.rooms.map((room) =>
                  room.roomId === ratingData.roomId
                    ? { ...room, userRating: ratingData.rating }
                    : room
                ),
              };
            }
            return booking;
          })
        );
      } else {
        setTourBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === ratingData.bookingId
              ? { ...booking, userRating: ratingData.rating }
              : booking
          )
        );
      }

      fetchUserReviews(authToken);

      setRatingDialogOpen(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      // Handle error (show error message to user)
    }
  };

  const hasReviewForRoom = (bookingId, roomId) => {
    return userReviews.some(
      (review) =>
        review.bookingId === bookingId &&
        review.itemId === roomId &&
        review.bookingType === "room"
    );
  };

  // Helper function to check if a tour has been reviewed
  const hasReviewForTour = (bookingId) => {
    return userReviews.some(
      (review) =>
        review.bookingId === bookingId && review.bookingType === "tour"
    );
  };

  const isPastBooking = (booking, bookingType) => {
    const currentDate = new Date();
    const bookingEndDate =
      bookingType === "room"
        ? new Date(booking.checkOut)
        : new Date(booking.tourDate);

    return bookingEndDate < currentDate;
  };

  const hasBeenRated = (booking) => {
    return booking.userRating && booking.userRating > 0;
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-4xl min-h-screen mx-auto mt-10 p-6">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-10 w-24 mb-8" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-screen min-h-screen mx-auto px-4 sm:px-6 flex justify-center items-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <div className="grid grid-cols-1 md:grid-cols-3 mt-10 gap-6 mb-20 w-full max-w-6xl">
          {/* Profile Card */}
          <Card className="md:col-span-1 max-h-fit bg-white">
            <CardHeader className="pb-3">
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4 mb-6">
                <img
                  className="h-24 w-24 rounded-full object-cover"
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                    user.name ? user.name[0] : "U"
                  }`}
                  alt={user.name}
                />
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Section */}
          <div className="md:col-span-2 bg-white">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  View your room and tour bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rooms" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 border rounded-lg overflow-hidden">
                    <TabsTrigger
                      value="rooms"
                      className="text-gray-600 font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Room Bookings
                    </TabsTrigger>
                    <TabsTrigger
                      value="tours"
                      className="text-gray-600 font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Tour Bookings
                    </TabsTrigger>
                  </TabsList>

                  {/* Room Bookings Tab */}
                  <TabsContent value="rooms" className="w-full mt-4">
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : roomBookings.length > 0 ? (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto w-full">
                        {roomBookings.map((booking, index) => (
                          <RoomBookingCard
                            key={booking._id}
                            booking={booking}
                            getStatusColor={getStatusColor}
                            formatDate={formatDate}
                            openRatingDialog={openRatingDialog}
                            hasReviewForRoom={hasReviewForRoom}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 w-full">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">
                          No room bookings
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          You don't have any room bookings yet.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate("/availability")}>
                          Book a Room
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tour Bookings Tab */}
                  <TabsContent value="tours" className="w-full mt-4">
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : tourBookings.length > 0 ? (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto w-full">
                        {tourBookings.map((booking, index) => (
                          <TourBookingCard
                            key={index}
                            booking={booking}
                            getStatusColor={getStatusColor}
                            formatDate={formatDate}
                            openRatingDialog={openRatingDialog}
                            hasReviewForTour={hasReviewForTour}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 w-full">
                        <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">
                          No tour bookings
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          You don't have any tour bookings yet.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate("/tours")}>
                          Book a Tour
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <RatingDialog
        isOpen={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        bookingDetails={currentBookingToRate}
        onSubmitRating={handleSubmitRating}
      />
      <Footer />
    </>
  );
}
