"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState("carousel");

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
          <div className="h-[220px] bg-slate-700/40 rounded-t-lg"></div>
          <div className="p-4 space-y-4 bg-slate-800/40">
            <div className="h-5 bg-slate-700/60 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700/60 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700/60 rounded w-5/6"></div>
            <div className="h-10 bg-slate-700/60 rounded"></div>
            <div className="h-8 bg-slate-700/60 rounded w-1/3"></div>
          </div>
        </div>
      ));
  };

  return (
    <div id="tours" className="relative py-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/80 to-transparent -z-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header section with title and view toggles */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="text-center mb-6 md:mb-0">
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-3"
              style={{ fontFamily: "Poppins" }}>
              Curated Experiences
            </h2>
            <p className="mt-5 text-indigo-200 max-w-2xl mx-auto">
              Discover handpicked destinations and unforgettable adventures
              tailored to your travel style
            </p>
          </div>

          <div className="flex items-center mt-5 space-x-3">
            <Button
              size="sm"
              onClick={() => setViewMode("carousel")}
              className={`rounded-full px-4 py-2 flex items-center transition-colors ${
                viewMode === "carousel"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}>
              <List className="w-4 h-4 mr-2" />
              Carousel
            </Button>

            <Button
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-full px-4 py-2 flex items-center transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}>
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
          </div>
        </div>

        {/* Carousel View */}
        {viewMode === "carousel" && (
          <div className="relative">
            {/* Updated button positioning */}
            <div className="flex items-center">
              {/* Left navigation button - positioned outside the carousel */}
              <div className="hidden sm:block mr-4">
                {showLeftButton && (
                  <Button
                    className="bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hover:bg-white/20 transition-colors duration-300 border-0"
                    onClick={() => scroll("left")}
                    aria-label="Scroll left"
                    variant="ghost">
                    <ChevronLeft className="w-6 h-6 text-white" />
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
                          className="w-[320px] flex-shrink-0 rounded-lg overflow-hidden transform transition-all duration-300 hover:translate-y-[-8px] snap-start">
                          <TourCard
                            tour={tour}
                            handleTourClick={handleTourClick}
                            onClick={() => handleTourClick(tour)}
                          />
                        </div>
                      ))}

                      {/* View more card */}
                      <div className="w-[320px] flex-shrink-0 rounded-2xl overflow-hidden h-[480px] flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/20 snap-start">
                        <div className="text-center p-8">
                          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                            <ChevronRight className="w-8 h-8 text-indigo-300" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Explore More
                          </h3>
                          <p className="text-indigo-200 mb-6">
                            Discover our complete collection of unique
                            experiences
                          </p>
                          <Button
                            onClick={() => navigate("/tours")}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                            View All Tours
                          </Button>
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
                    className="bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hover:bg-white/20 transition-colors duration-300 border-0"
                    onClick={() => scroll("right")}
                    aria-label="Scroll right"
                    variant="ghost">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile scroll indicators */}
            <div className="flex justify-center mt-4 space-x-2 sm:hidden">
              <Button
                className="bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hover:bg-white/20 transition-colors duration-300 border-0 h-10 w-10"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                variant="ghost"
                disabled={!showLeftButton}>
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>
              <Button
                className="bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hover:bg-white/20 transition-colors duration-300 border-0 h-10 w-10"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                variant="ghost"
                disabled={!showRightButton}>
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array(8)
                .fill(0)
                .map((_, index) => (
                  <div key={`loading-grid-${index}`} className="animate-pulse">
                    <div className="h-[220px] bg-slate-700/40 rounded-t-lg"></div>
                    <div className="p-4 space-y-4 bg-slate-800/40 rounded-b-lg">
                      <div className="h-5 bg-slate-700/60 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-700/60 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-700/60 rounded w-5/6"></div>
                      <div className="h-10 bg-slate-700/60 rounded"></div>
                      <div className="h-8 bg-slate-700/60 rounded w-1/3"></div>
                    </div>
                  </div>
                ))
            ) : (
              <>
                {latestTours.map((tour) => (
                  <div
                    key={tour._id}
                    className="transform transition-all duration-300 hover:translate-y-[-8px]">
                    <TourCard
                      tour={tour}
                      handleTourClick={handleTourClick}
                      onClick={() => handleTourClick(tour)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-10 bg-slate-700/40 rounded w-16 mx-auto animate-pulse"></div>
              ) : (
                formatNumber(stats.destinations)
              )}
            </div>
            <div className="text-indigo-200">Destinations</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-10 bg-slate-700/40 rounded w-16 mx-auto animate-pulse"></div>
              ) : (
                formatNumber(stats.tours)
              )}
            </div>
            <div className="text-indigo-200">Tours</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-10 bg-slate-700/40 rounded w-16 mx-auto animate-pulse"></div>
              ) : (
                formatNumber(stats.travellers)
              )}
            </div>
            <div className="text-indigo-200">Happy Travellers</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-10 bg-slate-700/40 rounded w-16 mx-auto animate-pulse"></div>
              ) : (
                stats.ratings
              )}
            </div>
            <div className="text-indigo-200">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourSection;
