"use client"

import { useRef, useCallback, useState } from "react"
import { Card, CardDescription, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSection from "./LoadingSection"

export default function CuratedExperiences({ tours, handleTourBooking, isLoading }) {
  const [isLeftmostTour, setIsLeftmostTour] = useState(true)
  const [isRightmostTour, setIsRightmostTour] = useState(false)
  const toursScrollRef = useRef(null)

  const scrollTours = useCallback((direction) => {
    if (toursScrollRef.current) {
      const scrollAmount = toursScrollRef.current.offsetWidth
      toursScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  const handleToursScroll = useCallback(() => {
    if (toursScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = toursScrollRef.current
      setIsLeftmostTour(scrollLeft === 0)
      setIsRightmostTour(scrollLeft + clientWidth === scrollWidth)
    }
  }, [])

  if (isLoading) {
    return <LoadingSection title="Curated Experiences" />
  }

  if (tours.length === 0) return null;

  return (
    <section id="tours" className="bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Curated Experiences</h2>
        <div className="relative">
          <div className="overflow-x-auto hide-scrollbar" ref={toursScrollRef} onScroll={handleToursScroll}>
            <div className="flex">
              {tours.map((tour) => (
                <div key={tour.id} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-4">
                  <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={tour.image || "/placeholder.svg"}
                      alt={tour.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <div className="flex-1 p-6">
                      <CardTitle className="mb-2">{tour.title}</CardTitle>
                      <CardDescription>Located in {tour.location}</CardDescription>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xl font-bold text-brand-purple">₹{tour.price}</span>
                        <Button variant="outline" onClick={() => handleTourBooking(tour)}>
                          Book Tour
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={() => scrollTours("left")}
            disabled={isLeftmostTour}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={() => scrollTours("right")}
            disabled={isRightmostTour}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  )
}
