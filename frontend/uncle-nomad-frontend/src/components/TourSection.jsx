import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import TourCard from './TourCard'; // Make sure to import TourCard
import AnimatedSection from "./AnimatedSection";
const TourSection = ({ tours, setIsBookingModalOpen, isBookingModalOpen }) => {
  
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const scrollRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const updateScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
    }
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [updateScrollButtons]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Adjust the scroll speed
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300); // Update after scroll animation
    }
  };

  const handleTourClick = (tour) => {
    // Use navigate to go to the TourDetailsPage, passing the tour's data via state
    navigate(`/tour/${tour._id}`, {
      state: { selectedTour: tour } // Pass the selected tour via state
    });
  };

  return (
    <div id="tours" className="container mx-auto px-4 py-16 relative">
      <h2 className="text-4xl font-extrabold mb-8 text-center text-white relative z-10" style={{'fontFamily': 'Poppins'}}>
        Curated Experiences
      </h2>

      <div className="relative z-10">
        {/* Left Scroll Button */}
        {showLeftButton && (
          <Button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 shadow-lg p-2 rounded-full hidden md:flex hover:bg-white transition-colors duration-300"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        
        <AnimatedSection animation="slide-left " duration={1200}>
        {/* Scrollable Tour Cards Container */}
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto scroll-smooth justify-center scrollbar-hide pb-8 pt-4 px-4 md:px-12"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "1rem",
            scrollPaddingRight: "1rem",
          }}
          onScroll={updateScrollButtons}
        >
          {tours.map((tour) => (
            <div
              key={tour._id}
              className="w-[300px] flex-shrink-0 rounded-lg overflow-hidden"
              style={{ scrollSnapAlign: "start" }}
            >
              <TourCard
                tour={tour} // Pass the tour to the TourCard
                handleTourClick={handleTourClick}
                onClick={() => handleTourClick(tour)} // Handle click to navigate to details page
              />
            </div>
          ))}
        </div>
        </AnimatedSection>
        {/* Right Scroll Button */}
        {showRightButton && (
          <Button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 shadow-lg p-2 rounded-full hidden md:flex hover:bg-white transition-colors duration-300"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TourSection;
