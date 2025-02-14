"use client"

import { useRef, useCallback, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSection from "./LoadingSection"

function TourGuides({ guides, handleGuideBooking, isLoading }) {
  const [isLeftmostGuide, setIsLeftmostGuide] = useState(true)
  const [isRightmostGuide, setIsRightmostGuide] = useState(false)
  const guidesScrollRef = useRef(null)

  const scrollGuides = useCallback((direction) => {
    if (guidesScrollRef.current) {
      const scrollAmount = guidesScrollRef.current.offsetWidth
      guidesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  const handleGuidesScroll = useCallback(() => {
    if (guidesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = guidesScrollRef.current
      setIsLeftmostGuide(scrollLeft === 0)
      setIsRightmostGuide(scrollLeft + clientWidth === scrollWidth)
    }
  }, [])

  if (isLoading) {
    return <LoadingSection title="Tour Guides" />
  }

  if (guides.length === 0) return null;

  return (
    <section id="guides" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8 text-center">Our Expert Tour Guides</h2>
      <div className="relative">
        <div className="overflow-x-auto hide-scrollbar" ref={guidesScrollRef} onScroll={handleGuidesScroll}>
          <div className="flex">
            {guides.map((guide) => (
              <div key={guide.id} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-4">
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="text-center">
                    <img
                      src={guide.image || "/placeholder.svg"}
                      alt={guide.name}
                      width={120}
                      height={120}
                      className="mx-auto rounded-full mb-4"
                    />
                    <CardTitle className="text-lg">{guide.name}</CardTitle>
                    <CardDescription>{guide.speciality}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm mb-2">Experience: {guide.experience}</p>
                    <p className="text-sm">Languages: {guide.languages.join(", ")}</p>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button variant="outline" onClick={() => handleGuideBooking(guide)}>
                      Book Guide
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={() => scrollGuides("left")}
          disabled={isLeftmostGuide}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={() => scrollGuides("right")}
          disabled={isRightmostGuide}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  )
}

export default TourGuides
