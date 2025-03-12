"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "../components/ui/button"
import { ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react"
import { useNavigate } from "react-router-dom"
import TourCard from "../components/TourCard"
import { Badge } from "../components/ui/badge"

const TourSection = ({ tours, stats, setStats, setIsBookingModalOpen, isBookingModalOpen }) => {
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const [viewMode, setViewMode] = useState("carousel")
  
  // const [activeCategory, setActiveCategory] = useState("all")
  const scrollRef = useRef(null)
  const navigate = useNavigate()

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
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setTimeout(updateScrollButtons, 300)
    }
  }

  const handleTourClick = (tour) => {
    navigate(`/tour/${tour._id}`, {
      state: { selectedTour: tour },
    })
  }

  const formatNumber = (number) => {
    if (number < 1000) {
      // For numbers below 1000, round to the nearest 10 or 50 depending on the range
      if (number < 100) {
        return `${Math.floor(number / 10) * 10}+`;  // Round to nearest 10 (e.g., 20 -> 20+)
      }
      return `${Math.floor(number / 50) * 50}+`;  // Round to nearest 50 (e.g., 520 -> 500+)
    } else {
      // For numbers 1000 and above, round to the nearest thousand and add 'K+'
      const rounded = Math.floor(number / 1000);
      return `${rounded}K+`;  // 1200 -> 1K+
    }
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3" style={{ fontFamily: "Poppins" }}>
              Curated Experiences
            </h2>
            <p className="mt-5 text-indigo-200 max-w-2xl mx-auto">
              Discover handpicked destinations and unforgettable adventures tailored to your travel style
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
              }`}
            >
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
              }`}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
          </div>
        </div>

        {/* Category filters */}
        {/* <div className="flex overflow-x-auto scrollbar-hide pb-4 mb-8">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={`px-4 py-2 text-sm capitalize cursor-pointer transition-all ${
                  activeCategory === category
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    : "hover:bg-slate-800"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div> */}

        {/* Carousel View */}
        {viewMode === "carousel" && (
          <div className="relative">
            {showLeftButton && (
              <Button
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hidden md:flex hover:bg-white/20 transition-colors duration-300 border-0"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                variant="ghost"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>
            )}

            <div
              ref={scrollRef}
              className="flex space-x-6 overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-4 pl-4 pr-4 md:pr-12 min-w-0"
              style={{
                scrollSnapType: "x mandatory",
                scrollPaddingLeft: "1rem",
              }}
              onScroll={updateScrollButtons}
            >
              {tours.map((tour) => (
                <div
                  key={tour._id}
                  className="w-[320px] flex-shrink-0 rounded-lg overflow-hidden transform transition-all duration-300 hover:translate-y-[-8px]"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <TourCard tour={tour} handleTourClick={handleTourClick} onClick={() => handleTourClick(tour)} />
                </div>
              ))}

              {/* View more card */}
              <div className="w-[320px] flex-shrink-0 rounded-2xl overflow-hidden h-[480px] flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/20">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <ChevronRight className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Explore More</h3>
                  <p className="text-indigo-200 mb-6">Discover our complete collection of unique experiences</p>
                  <Button onClick={()=>navigate('/tours')}  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    View All Tours
                  </Button>
                </div>
              </div>
            </div>

            {showRightButton && (
              <Button
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md shadow-lg p-2 rounded-full hidden md:flex hover:bg-white/20 transition-colors duration-300 border-0"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                variant="ghost"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tours.map((tour) => (
              <div key={tour._id} className="transform transition-all duration-300 hover:translate-y-[-8px]">
                <TourCard tour={tour} handleTourClick={handleTourClick} onClick={() => handleTourClick(tour)} />
              </div>
            ))}
          </div>
        )}

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{formatNumber(stats.destinations)}</div>
            <div className="text-indigo-200">Destinations</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{formatNumber(stats.tours)}</div>
            <div className="text-indigo-200">Tours</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{formatNumber(stats.travellers)}</div>
            <div className="text-indigo-200">Happy Travellers</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-white mb-2">{stats.ratings}</div>
            <div className="text-indigo-200">Average Rating</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TourSection

