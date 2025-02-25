"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import TourCard from "./TourCard"
import TourDetailsModal from "./TourDetailsModal"
import TourBookingModal from "./TourBookingModal"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import CheckingPaymentModal from "./CheckingPaymentModal"

const TourSection = ({ tours, setIsBookingModalOpen, isBookingModalOpen }) => {
  const [selectedTour, setSelectedTour] = useState(null)
  const [isTourModalOpen, setIsTourModalOpen] = useState(false)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const [isCheckingOpen, setIsCheckingOpen] = useState(false)
  const scrollRef = useRef(null)

  const handleBookNowClick = () => {
    setIsTourModalOpen(false)
    setIsBookingModalOpen(true)
  }

  const updateScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftButton(scrollLeft > 0)
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10) // 10px threshold
    }
  }, [])

  useEffect(() => {
    updateScrollButtons()
    window.addEventListener("resize", updateScrollButtons)
    return () => window.removeEventListener("resize", updateScrollButtons)
  }, [updateScrollButtons])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Adjust the scroll speed
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setTimeout(updateScrollButtons, 300) // Update after scroll animation
    }
  }

  return (
    <div id="tours" className="container mx-auto px-4 py-16 relative">
      <h2 className="text-4xl font-bold mb-8 text-center">Curated Experiences</h2>

      <div className="relative">
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

        {/* Scrollable Tour Cards Container */}
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 px-4 md:px-12"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "1rem",
            scrollPaddingRight: "1rem",
          }}
          onScroll={updateScrollButtons}
        >
          {tours.map((tour) => (
            <div key={tour._id} className="w-[300px] flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
              <TourCard
                tour={tour}
                setSelectedTour={setSelectedTour}
                handleBookNowClick={handleBookNowClick}
                setIsBookingModalOpen={setIsBookingModalOpen}
                onClick={() => {
                  setSelectedTour(tour)
                  setIsTourModalOpen(true)
                }}
              />
            </div>
          ))}
        </div>

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

      {/* Tour Details Modal */}
      <TourDetailsModal
        tour={selectedTour}
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onBook={handleBookNowClick}
      />

      {/* Tour Booking Modal */}
      <TourBookingModal
        isCheckingOpen={isCheckingOpen}
        setIsCheckingOpen={setIsCheckingOpen}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedTour={selectedTour}
      />

      <CheckingPaymentModal
        open={isCheckingOpen}
      />
    </div>
  )
}

export default TourSection

