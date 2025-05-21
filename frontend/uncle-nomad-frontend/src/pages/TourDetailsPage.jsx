"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  ChevronLeft,
  Clock,
  Users,
  Calendar,
  MapPin,
  IndianRupee,
  Star,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CheckingPaymentModal from "../modals/CheckingPaymentModal";

// Extracted components for better maintainability
import TourInfoCard from "../components/TourInfoCard";
import PricingCard from "../components/PricingCard";
import ItineraryDay from "../components/ItineraryDay";
import ReviewCard from "../components/ReviewCard";
import ImageGallery from "../components/ImageGallery";
import { formatDate, formatDateWithOptions } from "../utils/dateUtils";

const TourDetailsPage = () => {
  const { state } = useLocation();
  const [tour, setTour] = useState(state?.selectedTour);
  const [activeTab, setActiveTab] = useState("overview");
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(!tour);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!tour) {
      const fetchTourDetails = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("authToken");
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/tours/${state?.selectedTour?._id}`,
            {
              headers: {
                "x-api-key": process.env.REACT_APP_API_KEY,
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch tour details");
          }

          const data = await response.json();
          setTour(data);
        } catch (err) {
          setError(err.message);
          console.error("Error fetching tour details:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchTourDetails();
    }
  }, [state?.selectedTour?._id, tour]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/", { state: { section: "tours" } })}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Tour Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the tour you're looking for.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Get pricing information from pricingPackages or fallback to priceOptions/price
  const getPricingInfo = () => {
    // If pricingPackages exists and has values, use the lowest price
    if (tour.pricingPackages && tour.pricingPackages.length > 0) {
      const prices = tour.pricingPackages.map((pkg) => Number(pkg.price));
      return Math.min(...prices);
    }
    // If priceOptions exists and has values, use the lowest one
    else if (tour.priceOptions && Object.keys(tour.priceOptions).length > 0) {
      const prices = Object.values(tour.priceOptions).map((p) =>
        Number.parseInt(p)
      );
      return Math.min(...prices);
    }
    // Otherwise, fall back to the base price
    return Number.parseInt(tour.price) || "Contact for price";
  };

  // Calculate tour ratings (sample implementation)
  const ratings = {
    overall: tour.averageRating || 0,
    reviewCount: tour.reviewCount || 0,
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  // Navigate to booking page
  const handleBookNow = () => {
    navigate("/tour-booking", {
      state: {
        selectedTour: tour,
      },
    });
  };

  return (
    <>
      <Header />
      {/* Hero Section with Parallax Effect */}
      <div
        className="relative h-[60vh] bg-cover bg-center flex items-end"
        style={{
          backgroundImage: `url(${
            tour.images[0] || "/placeholder.svg?height=800&width=1200"
          })`,
          backgroundAttachment: "fixed",
        }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

        <div className="absolute top-4 left-4 md:left-8 z-20">
          <Button
            onClick={() => navigate(-1)}
            className="bg-white/20 hover:bg-white/30 text-white flex items-center px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>
        <div className="container mx-auto px-4 z-10 relative pb-12">
          <div className="text-white">
            <div className="opacity-100 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {tour.title}
              </h1>
              <div className="flex items-center flex-wrap gap-4 mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{tour.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{tour.duration} days</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Group size: {tour.groupSize}</span>
                </div>
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <span>
                    {tour.averageRating ? tour.averageRating.toFixed(1) : "N/A"}
                  </span>
                  {tour.reviewCount > 0 && (
                    <span className="text-white text-xs ml-1">
                      ({tour.reviewCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tour Information Section */}
      <div className="container mx-auto px-4 py-12 animate-slide-up">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 -mt-16 relative z-20">
          <TourInfoCard
            icon={<Calendar className="w-10 h-10 text-blue-600 mr-4" />}
            title="Available Dates"
            content={
              tour.availableDates && tour.availableDates.length > 0
                ? `${tour.availableDates.length} date periods`
                : tour.startDate && tour.endDate
                ? `${formatDate(new Date(tour.startDate))} - ${formatDate(
                    new Date(tour.endDate)
                  )}`
                : "Contact for dates"
            }
          />
          <TourInfoCard
            icon={<Users className="w-10 h-10 text-blue-600 mr-4" />}
            title="Group Size"
            content={`Max ${tour.groupSize} people`}
          />
          <TourInfoCard
            icon={<IndianRupee className="w-10 h-10 text-blue-600 mr-4" />}
            title="Starting From"
            content={`₹${getPricingInfo()}`}
          />
        </div>

        {/* Tabbed Navigation */}
        <div className="mb-8 border-b overflow-x-auto hide-scrollbar">
          <div className="flex space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 font-medium text-lg transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}>
              Overview
            </button>
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`pb-4 font-medium text-lg transition-colors ${
                activeTab === "itinerary"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}>
              Itinerary
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`pb-4 font-medium text-lg transition-colors ${
                activeTab === "pricing"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}>
              Pricing
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-medium text-lg transition-colors ${
                activeTab === "reviews"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}>
              Reviews
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  About This Tour
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {tour.description}
                </p>

                {tour.inclusions && tour.inclusions.length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                    <h3 className="text-xl font-semibold text-blue-700 mb-2">
                      Highlights
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {tour.inclusions.map((inclusion, index) => (
                        <li key={index}>{inclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tour.exclusions && tour.exclusions.length > 0 && (
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg mt-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Not Included
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {tour.exclusions.map((exclusion, index) => (
                        <li key={index}>{exclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tour.additionalInfo && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-6">
                    <h3 className="text-xl font-semibold text-amber-700 mb-2">
                      Additional Information
                    </h3>
                    <p className="text-gray-700">{tour.additionalInfo}</p>
                  </div>
                )}

                <ImageGallery
                  images={tour.images}
                  onImageClick={handleImageClick}
                />
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-24">
                  <div className="bg-blue-600 py-4 px-6">
                    <h3 className="text-xl font-semibold text-white">
                      Book This Tour
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 mb-6">
                      Secure your spot with a small deposit and pay the rest
                      later. Spots fill quickly!
                    </p>

                    <div className="flex justify-between text-gray-700 font-medium mb-2">
                      <span>Starting from</span>
                      <span className="text-xl text-blue-600 font-bold">
                        ₹{getPricingInfo()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">per person </p>

                    <Button
                      onClick={handleBookNow}
                      variant="nomad"
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 mt-6 py-3 rounded-lg shadow-lg">
                      Book Now
                    </Button>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        Only {tour.availableSlots || "limited"} spots left for
                        this experience
                      </p>
                    </div>

                    <div className="mt-8 border-t pt-6">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <span>Have questions?</span>
                        <a
                          onClick={() => {
                            const element =
                              document.getElementById("get-in-touch");
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth" });
                            } else {
                              navigate("/#get-in-touch"); // Fallback if section isn't on the current page
                            }
                          }}
                          className="text-blue-600 hover:underline">
                          Contact us
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Itinerary Tab */}
          {activeTab === "itinerary" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Your Day-by-Day Adventure
              </h2>
              <div className="space-y-8">
                {tour.itinerary &&
                  tour.itinerary.map((day, index) => (
                    <ItineraryDay
                      key={day._id || index}
                      day={day}
                      isLast={index === tour.itinerary.length - 1}
                    />
                  ))}

                {(!tour.itinerary || tour.itinerary.length === 0) && (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600">
                      Detailed itinerary will be available soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold mb-4">Pricing Options</h3>

              {/* Pricing Packages Display */}
              {tour.pricingPackages && tour.pricingPackages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tour.pricingPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="bg-white border rounded-lg shadow-sm overflow-hidden">
                      <div className="p-5 border-b bg-gray-50">
                        <h4 className="text-lg font-semibold">{pkg.name}</h4>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          ₹{pkg.price}
                        </p>
                      </div>
                      <div className="p-5">
                        {pkg.description && (
                          <p className="text-gray-600 mb-4">
                            {pkg.description}
                          </p>
                        )}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2">Features:</h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {pkg.features.map((feature, idx) => (
                                <li key={idx} className="text-gray-700">
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : tour.priceOptions &&
                Object.keys(tour.priceOptions).length > 0 ? (
                // Legacy price options display
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(tour.priceOptions).map(
                    ([option, price], index) => (
                      <PricingCard
                        key={index}
                        title={option}
                        price={price}
                        isPopular={index === 0}
                        features={[
                          "All inclusive package",
                          "Meals and accommodations",
                          "Local guide",
                          "Transportation",
                        ]}
                        onSelect={handleBookNow}
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PricingCard
                    title="Standard Package"
                    price={tour.price || "Contact for price"}
                    isPopular={true}
                    features={[
                      "All inclusive package",
                      "Meals and accommodations",
                      "Local guide",
                      "Transportation",
                    ]}
                    onSelect={handleBookNow}
                  />
                </div>
              )}

              <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                <h4 className="text-xl font-semibold mb-3">What's Included</h4>
                <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tour.inclusions && tour.inclusions.length > 0 ? (
                    tour.inclusions.map((item, index) => (
                      <li key={index} className="text-gray-700">
                        {item}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="text-gray-700">Accommodation</li>
                      <li className="text-gray-700">Meals as per itinerary</li>
                      <li className="text-gray-700">Transportation</li>
                      <li className="text-gray-700">Guide services</li>
                      <li className="text-gray-700">Entry fees</li>
                      <li className="text-gray-700">Activities</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-xl font-semibold mb-3">
                  What's Not Included
                </h4>
                <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tour.exclusions && tour.exclusions.length > 0 ? (
                    tour.exclusions.map((item, index) => (
                      <li key={index} className="text-gray-700">
                        {item}
                      </li>
                    ))
                  ) : (
                    <></>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">
                  Guest Reviews{" "}
                  {tour.reviewCount > 0 && `(${tour.reviewCount})`}
                </h2>
                <div className="flex items-center mt-4 md:mt-0">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(tour.averageRating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-700 font-medium">
                    {tour.averageRating
                      ? tour.averageRating.toFixed(1)
                      : "No Ratings"}{" "}
                    out of 5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tour.reviews.length > 0 ? (
                  tour.reviews.map((review, index) => (
                    <ReviewCard
                      key={index}
                      name={review.userName}
                      date={`Traveled in ${new Date(
                        review.createdAt
                      ).toLocaleString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}`}
                      rating={review.rating}
                      review={review.comment}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">
                    No reviews yet. Be the first to review this tour!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div
          className="relative rounded-xl bg-gray-50 p-8 md:p-12 text-white text-center"
          style={{
            backgroundImage: 'url("/solo.jpeg")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-xl"></div>

          {/* Content (positioned above the overlay) */}
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">
              Ready for an Unforgettable Adventure?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join us on this incredible journey through {tour.location}.
              Limited spaces available for this exclusive experience.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={handleBookNow}
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg py-3 px-8 rounded-lg font-medium">
                Book Now
              </Button>
              <Button
                onClick={() => {
                  const element = document.getElementById("get-in-touch");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  } else {
                    navigate("/#get-in-touch"); // Fallback if section isn't on the current page
                  }
                }}
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg py-3 px-8 rounded-lg font-medium">
                Ask a Question
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt={tour.title}
              className="max-w-full max-h-[90vh] object-contain"
              loading="lazy"
            />
            <button
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
                setSelectedImage(null);
              }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Footer />
      <CheckingPaymentModal isOpen={checking} />
    </>
  );
};

export default TourDetailsPage;
