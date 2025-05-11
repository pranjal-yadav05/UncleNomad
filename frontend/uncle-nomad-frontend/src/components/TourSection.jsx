"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TourCard from "../components/TourCard";
import { Badge } from "../components/ui/badge";

const TourSection = ({
  tours,
  stats,
  setStats,
  setIsBookingModalOpen,
  isBookingModalOpen,
  isLoading,
}) => {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  // Get the latest 4 tours only, make sure tours is an array before using slice
  const latestTours = Array.isArray(tours)
    ? tours.slice(0, 4)
    : tours && tours.tours
    ? tours.tours.slice(0, 4)
    : [];

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const updateScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
    }
  }, []);

  useEffect(() => {
    // Ensure scroll starts at the beginning (left)
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }

    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [updateScrollButtons, tours]); // Add tours dependency to reset scroll when tours change

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleTourClick = (tour) => {
    navigate(`/tour/${tour._id}`, {
      state: { selectedTour: tour },
    });
  };

  const formatNumber = (number) => {
    if (number < 1000) {
      // For numbers below 1000, round to the nearest 10 or 50 depending on the range
      if (number < 100) {
        return `${Math.floor(number / 10) * 10}+`; // Round to nearest 10 (e.g., 20 -> 20+)
      }
      return `${Math.floor(number / 50) * 50}+`; // Round to nearest 50 (e.g., 520 -> 500+)
    } else {
      // For numbers 1000 and above, round to the nearest thousand and add 'K+'
      const rounded = Math.floor(number / 1000);
      return `${rounded}K+`; // 1200 -> 1K+
    }
  };

  // Loading placeholders
  const LoadingPlaceholders = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <div
          key={`loading-${index}`}
          className="w-[320px] flex-shrink-0 rounded-lg overflow-hidden h-[480px] animate-pulse">
          <div className="h-[220px] bg-gray-200 rounded-t-lg"></div>
          <div className="p-4 space-y-4 bg-gray-100">
            <div className="h-5 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      ));
  };

  return (
    <div id="tours" className="relative py-10 pt-20 overflow-hidden w-full">
      {/* Background elements */}
      <div className="absolute inset-0 bg-white -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent -z-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header section with title only (removed view toggles) */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="text-center mb-6 md:mb-0">
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-3 relative inline-block transition-all duration-300 group"
              style={{ fontFamily: "Josefin Sans" }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-600 cursor-default transition-all duration-500">
                Curated Experiences
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600/40 to-purple-500/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-bottom"></span>
            </h2>
            <p className="mt-5 text-gray-600 max-w-2xl mx-auto">
              Discover handpicked destinations and unforgettable adventures
              tailored to your travel style
            </p>
          </div>
        </div>

        {/* Carousel View - always displayed (removed viewMode === "carousel" condition) */}
        <div className="relative">
          {/* Updated button positioning */}
          <div className="flex items-center">
            {/* Left navigation button - positioned outside the carousel */}
            <div className="hidden sm:block mr-4">
              {showLeftButton && (
                <Button
                  className="bg-gray-100 shadow-lg p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 border-0"
                  onClick={() => scroll("left")}
                  aria-label="Scroll left"
                  variant="ghost">
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </Button>
              )}
            </div>

            {/* Carousel container with padding to prevent overlap */}
            <div className="flex-1 overflow-hidden">
              <div
                ref={scrollRef}
                className="flex space-x-6 overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 min-w-0 snap-x snap-mandatory"
                onScroll={updateScrollButtons}>
                {isLoading ? (
                  <LoadingPlaceholders />
                ) : (
                  <>
                    {latestTours.map((tour) => (
                      <div
                        key={tour._id}
                        className="w-[320px] flex-shrink-0 rounded-lg overflow-hidden transform transition-all duration-300 snap-start">
                        <TourCard
                          tour={tour}
                          handleTourClick={handleTourClick}
                          onClick={() => handleTourClick(tour)}
                        />
                      </div>
                    ))}

                    {/* View more card */}
                    <div className="w-[320px] flex-shrink-0 snap-start p-3 group">
                      <div
                        className="rounded-2xl overflow-hidden h-[450px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 transition-all duration-300 group-hover:-translate-y-2 relative z-10"
                        style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 20px 40px rgba(66, 71, 200, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 10px 30px rgba(0, 0, 0, 0.08)";
                        }}>
                        <div className="text-center p-8">
                          <div
                            className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4"
                            style={{
                              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
                            }}>
                            <ChevronRight className="w-8 h-8 text-indigo-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            Explore More
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Discover our complete collection of unique
                            experiences
                          </p>
                          <Button
                            onClick={() => navigate("/tours")}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                            style={{
                              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow =
                                "0 6px 16px rgba(79, 70, 229, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(79, 70, 229, 0.3)";
                            }}>
                            View All Tours
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right navigation button - positioned outside the carousel */}
            <div className="hidden sm:block ml-4">
              {showRightButton && (
                <Button
                  className="bg-gray-100 shadow-lg p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 border-0"
                  onClick={() => scroll("right")}
                  aria-label="Scroll right"
                  variant="ghost">
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </Button>
              )}
            </div>
          </div>

          {/* Mobile scroll indicators */}
          <div className="flex justify-center mt-4 space-x-2 sm:hidden">
            <Button
              className="bg-gray-100 shadow-lg p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 border-0 h-10 w-10"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              variant="ghost"
              disabled={!showLeftButton}>
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <Button
              className="bg-gray-100 shadow-lg p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 border-0 h-10 w-10"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              variant="ghost"
              disabled={!showRightButton}>
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </Button>
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-2 group">
            <div
              className="bg-white rounded-2xl p-6 border border-gray-200 relative z-10 transition-all duration-300 group-hover:-translate-y-1"
              style={{ boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 25px rgba(66, 71, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.06)";
              }}>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {isLoading ? (
                  <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                ) : (
                  formatNumber(stats.destinations)
                )}
              </div>
              <div className="text-gray-600">Destinations</div>
            </div>
          </div>
          <div className="p-2 group">
            <div
              className="bg-white rounded-2xl p-6 border border-gray-200 relative z-10 transition-all duration-300 group-hover:-translate-y-1"
              style={{ boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 25px rgba(66, 71, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.06)";
              }}>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {isLoading ? (
                  <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                ) : (
                  formatNumber(stats.tours)
                )}
              </div>
              <div className="text-gray-600">Tours</div>
            </div>
          </div>
          <div className="p-2 group">
            <div
              className="bg-white rounded-2xl p-6 border border-gray-200 relative z-10 transition-all duration-300 group-hover:-translate-y-1"
              style={{ boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 25px rgba(66, 71, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.06)";
              }}>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {isLoading ? (
                  <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                ) : (
                  formatNumber(stats.travellers)
                )}
              </div>
              <div className="text-gray-600">Travelers</div>
            </div>
          </div>
          <div className="p-2 group">
            <div
              className="bg-white rounded-2xl p-6 border border-gray-200 relative z-10 transition-all duration-300 group-hover:-translate-y-1"
              style={{ boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 25px rgba(66, 71, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.06)";
              }}>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {isLoading ? (
                  <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                ) : (
                  stats.ratings
                )}
              </div>
              <div className="text-gray-600">Ratings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourSection;
