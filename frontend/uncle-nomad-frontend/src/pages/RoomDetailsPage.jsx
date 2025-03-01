"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ChevronLeft, Calendar, Users, Wifi, Coffee, BedDouble, Star, Check, Images } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import ImageGallery from "../components/ImageGallery"
import PricingCard from "../components/PricingCard"
import ReviewCard from "../components/ReviewCard"

const RoomDetailsPage = () => {
  const { state } = useLocation()
  const [room, setRoom] = useState(state?.selectedRoom)
  const [activeTab, setActiveTab] = useState("overview")
  const [showImageModal, setShowImageModal] = useState(false)
  const [loading, setLoading] = useState(!room)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)

  // Get data from location state
  const returnToSelection = state?.returnToSelection || false
  const selectedRooms = state?.selectedRooms || {}
  const checkIn = state?.checkIn
  const checkOut = state?.checkOut
  const availableRooms = state?.availableRooms || []

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!room) {
      const fetchRoomDetails = async () => {
        console.log('fetching details')
        try {
          setLoading(true)
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms/${state?.selectedRoom?._id}`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}})

          if (!response.ok) {
            throw new Error("Failed to fetch room details")
          }

          const data = await response.json()
          setRoom({
            ...data,
            imageUrl: data.imageUrl || "/placeholder.svg", // ✅ Ensure main image exists
            imageUrls: data.imageUrls || [], // ✅ Ensure all images are included
          });
        } catch (err) {
          setError(err.message)
          console.error("Error fetching room details:", err)
        } finally {
          setLoading(false)
        }
      }

      fetchRoomDetails()
    }
  }, [state?.selectedRoom?._id, room])

  // Handle back button click
  const handleBackClick = () => {
    if (returnToSelection) {
      // Return to room selection page with state preserved
      navigate("/room-selection", {
        state: {
          availableRooms,
          selectedRooms,
          checkIn,
          checkOut,
        },
      })
    } else {
      // Normal back navigation
      navigate(-1)
    }
  }

  // Handle booking button click
  const handleBookNow = () => {
    if (returnToSelection) {
      // Return to room selection page with state preserved
      navigate("/room-selection", {
        state: {
          availableRooms,
          selectedRooms,
          checkIn,
          checkOut,
        },
      })
    } else {
      // Navigate to availability section to start booking
      navigate("/availability");
    }
  }

  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleBackClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Room Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the room you're looking for.</p>
          <Button onClick={handleBackClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "Select dates"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Calculate number of nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = Math.abs(checkOutDate - checkInDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    const nights = calculateNights()
    return room.price * nights || room.price
  }

  // Room amenities
  const amenities = room.amenities && Array.isArray(room.amenities) ? room.amenities : [];
  console.log('amenitiees',amenities)


  return (
    <>
      <Header />
      {/* Hero Section with Parallax Effect */}
      <div
        className="relative h-[60vh] bg-cover bg-center flex items-end"
        style={{
          backgroundImage: `url(${room.images?.[0] || room.imageUrl || "/placeholder-room.jpg"})`,
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

        <div className="absolute top-4 left-4 md:left-8 z-20">
          <Button
            onClick={handleBackClick}
            className="bg-white/20 hover:bg-white/30 text-white flex items-center px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {returnToSelection ? "Back to Room Selection" : "Back"}
          </Button>
        </div>
        <div className="container mx-auto px-4 z-10 relative pb-12">
          <div className="text-white">
            <div className="opacity-100 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{room.type || "Room Type Not Specified"}</h1>
              <div className="flex items-center flex-wrap gap-4 mb-4">
                <div className="flex items-center">
                  <BedDouble className="w-4 h-4 mr-1" />
                  <span>{room.type || "Not specified"} Room</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Sleeps {room.capacity || 2} guests</span>
                </div>
                <div className="flex items-center">
                  <Coffee className="w-4 h-4 mr-1" />
                  <span>{room.mealIncluded ? "Breakfast included" : "Room only"}</span>
                </div>
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <span>{room.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Information Section */}
      <div className="container mx-auto px-4 py-12 animate-slide-up">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 -mt-16 relative z-20">
          <div className="bg-white shadow-lg rounded-xl p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
            <Calendar className="w-10 h-10 text-blue-600 mr-4" />
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Your Stay</h3>
              <p className="text-gray-800 font-semibold">
                {formatDate(checkIn)} - {formatDate(checkOut)}
              </p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
            <Users className="w-10 h-10 text-blue-600 mr-4" />
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Max Occupancy</h3>
              <p className="text-gray-800 font-semibold">{room.capacity || 2} guests</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-4">₹</div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Price per night</h3>
              <p className="text-gray-800 font-semibold">
                {room.price ? `₹${room.price}` : "Price not available"}
              </p>

            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="mb-8 border-b overflow-x-auto hide-scrollbar">
          <div className="flex space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 font-medium text-lg transition-colors ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("amenities")}
              className={`pb-4 font-medium text-lg transition-colors ${activeTab === "amenities" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"}`}
            >
              Amenities
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`pb-4 font-medium text-lg transition-colors ${activeTab === "pricing" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"}`}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-medium text-lg transition-colors ${activeTab === "reviews" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"}`}
            >
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
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Room Description</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {room.description ||
                    `Experience comfort and elegance in our spacious ${room.type || "Standard"} room. 
                                    This beautifully appointed accommodation offers a perfect blend of modern amenities 
                                    and warm aesthetics to make your stay memorable. Featuring plush bedding, elegant 
                                    décor, and all the essentials you need for a relaxing getaway.`}
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">Room Highlights</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>{room.capacity ? `${room.capacity} guest maximum occupancy` : "Capacity not specified"}</li>
                    <li>{room.size ? `${room.size} sq ft of space` : "Size not available"}</li>
                    <li>{room.view ? `${room.view} view` : "View not specified"}</li>
                    <li>{room.mealIncluded ? "Breakfast included" : "Room only rate"}</li>
                  </ul>

                </div>
                <ImageGallery
                  images={
                    room.imageUrls?.map((src, index) => ({
                      src,
                      alt: `${room.type} - view ${index + 1}`,
                    })) || [{ src: room.imageUrl || "/placeholder-room.jpg", alt: `${room.type} - view 1` }]
                  }
                  onImageClick={(image) => {
                    setSelectedImage(image.src);
                    setShowImageModal(true);
                  }}
                />
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-24">
                  <div className="bg-blue-600 py-4 px-6">
                    <h3 className="text-xl font-semibold text-white">Book This Room</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 mb-6">
                      Lock in your preferred dates now. Our rooms fill quickly during peak season!
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-gray-700">
                        <span>Price per night</span>
                        <span>₹{room.price || 3999}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Number of nights</span>
                        <span>{calculateNights() || "-"}</span>
                      </div>
                      <div className="pt-4 border-t flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{calculateTotalPrice() || room.price || 3999}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleBookNow}
                      variant="custom"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-medium transition-colors duration-300"
                    >
                      {returnToSelection ? "Return to Selection" : "Book Now"}
                    </Button>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        {room.availability?.availableRooms || room.availability?.availableBeds
                          ? `Only ${room.availability.availableRooms || room.availability.availableBeds} left!`
                          : "Limited availability!"}
                      </p>
                    </div>

                    <div className="mt-8 border-t pt-6">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <span>Questions about this room?</span>
                        <a href="#" className="text-blue-600 hover:underline">
                          Contact us
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    
          {/* Amenities Tab */}
          {activeTab === "amenities" && (
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Room Amenities</h2>
                {room.amenities && room.amenities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {room.amenities.map((amenity, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-md flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{amenity}</span>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-gray-600">No amenities available for this room.</p>
                )}
            </div>
            )}


          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Room Pricing & Packages</h2>
              <p className="text-gray-700 mb-8">Choose the rate that best suits your needs.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PricingCard
                  title="Room Only"
                  price={room.price || 3999}
                  features={[
                    "Spacious accommodations",
                    "Free Wi-Fi",
                    "Cable TV",
                    "Coffee/tea maker",
                    "No meals included",
                  ]}
                  onSelect={handleBookNow}
                />

                <PricingCard
                  title="Bed & Breakfast"
                  price={room.price + 500 || 4499}
                  isPopular={true}
                  features={[
                    "All Room Only benefits",
                    "Daily breakfast buffet",
                    "Early check-in (subject to availability)",
                    "Welcome drink on arrival",
                    "Daily newspaper",
                  ]}
                  onSelect={handleBookNow}
                />

                <PricingCard
                  title="All Inclusive"
                  price={room.price + 1500 || 5499}
                  features={[
                    "All Bed & Breakfast benefits",
                    "Three meals per day",
                    "Free minibar (restocked daily)",
                    "One-hour spa treatment",
                    "Late check-out guaranteed",
                  ]}
                  onSelect={handleBookNow}
                />
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Guest Reviews</h2>
                <div className="flex items-center mt-4 md:mt-0">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(room.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-700 font-medium">{room.rating} out of 5</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ReviewCard
                  name="Sarah Johnson"
                  date="Stayed in January 2025"
                  rating={5}
                  review="This room exceeded all my expectations! The bed was incredibly comfortable, the room was spacious and clean, and the amenities were perfect. I particularly loved the view from the window and the fact that the bathroom was so well-appointed."
                />

                <ReviewCard
                  name="Michael Chen"
                  date="Stayed in December 2024"
                  rating={4}
                  review="Great room overall. Very comfortable and well-maintained. The only minor issue was that I could hear some noise from the hallway occasionally, but it wasn't a major problem. The staff was very responsive to all requests."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Image Gallery Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Selected Room Image" 
              className="max-w-full max-h-[90vh] object-contain"
              loading="lazy"
            />
            <button 
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
                setSelectedImage(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}


      <Footer />
    </>
  )
}

export default RoomDetailsPage

