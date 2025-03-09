"use client"

import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Calendar, Clock, Heart, MapPin, Star, Users } from "lucide-react"

const TourCard = ({ tour, onClick, handleTourClick }) => {
  const [isLiked, setIsLiked] = useState(false)

  const handleButtonClick = (event) => {
    event.stopPropagation()
    handleTourClick(tour)
  }

  const handleLikeClick = (event) => {
    event.stopPropagation()
    setIsLiked(!isLiked)
  }

  // Determine if tour is trending or has a special offer
  const isTrending = tour.bookings > 50
  const hasSpecialOffer = tour.discount > 0

  return (
    <Card
      className="w-full flex flex-col bg-white/5 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden group border border-white/10"
      onClick={onClick}
    >
      {/* Image Container with Overlay */}
      <div className="w-full h-56 flex-shrink-0 overflow-hidden relative">
        <img
          src={tour.images[0] || "/placeholder.svg?height=400&width=600"}
          alt={tour.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Like Button */}
        <button
          onClick={(event) => event.stopPropagation()}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:bg-white/20 z-10"
        >
          <img src={'/face-logo.png'} alt="Company Logo" className="object-contain" />
        </button>


        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
          ₹{tour.price.toLocaleString()}
        </div>

        {/* Special Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isTrending && <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">Trending</Badge>}
          {hasSpecialOffer && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">{tour.discount}% Off</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-full text-white">
        {/* Title */}
        <h3 className="text-xl font-bold mb-2 truncate" style={{ fontFamily: "Poppins" }}>
        {tour.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-indigo-200 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm truncate">{tour.location}</span>
        </div>

        {/* Description */}
        <p className="text-indigo-100/80 text-sm line-clamp-2 mb-4" style={{ fontFamily: "Poppins" }}>
          {tour.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-indigo-100">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-300" />
            <span>{tour.duration} days</span>
          </div>
          <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-1 text-indigo-300" />
            <span>Max {tour.maxGroupSize}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-indigo-300" />
            <span>{tour.startDates?.length || 0} dates</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= (tour.ratingsAverage || 4.5) ? "text-amber-400 fill-amber-400" : "text-gray-400"
                }`}
              />
            ))}
          </div>
          <span className="text-xs ml-2 text-indigo-100">
            {tour.ratingsAverage || 4.5} ({tour.ratingsQuantity || 24} reviews)
          </span>
        </div>

        {/* Book Now Button */}
        <Button
          onClick={handleButtonClick}
          variant='nomad'
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 py-3 rounded-lg shadow-lg mt-auto border-0"
          style={{ fontFamily: "Poppins" }}
        >
          Book Now
        </Button>
      </div>
    </Card>
  )
}

export default TourCard

