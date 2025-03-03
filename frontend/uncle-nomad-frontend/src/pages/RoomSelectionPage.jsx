"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Star } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BookingModal from "../modals/BookingModal"
import { format } from "date-fns"
import BookingConfirmationDialog from "../modals/BookingConfirmationDialog"
import BookingFailedDialog from "../modals/BookingFailedDialog"
import AnimatedSection from "../components/AnimatedSection"
import CheckingPaymentModal from "../modals/CheckingPaymentModal"

const RoomSelectionPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get data from location state
  const availableRooms = location.state?.availableRooms || []
  const checkIn = location.state?.checkIn
  const checkOut = location.state?.checkOut

  const [bookingForm, setBookingForm] = useState({
    selectedRooms: location.state?.selectedRooms || {},
    guestName: "",
    email: "",
    phone: "",
    numberOfGuests: 1,
    imageUrl:'',
    imageUrls:'',
    numberOfChildren: 0,
    mealIncluded: false,
    extraBeds: 0,
    specialRequests: "",
    checkIn: checkIn || null,
    checkOut: checkOut || null,
  })

  const [bookingError, setBookingError] = useState("")
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)
  const [isBookingFailed, setIsBookingFailed] = useState(false)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isBookingConfirmed) {
      // Push a new state and prevent back navigation
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = () => {
        navigate("/", { replace: true }); // Redirect to home page if they try to go back
      };
    }
  }, [isBookingConfirmed, navigate]);
  

  useEffect(() => {
    window.scrollTo(0, 0)

    // If no available rooms or dates, redirect back to availability section
    if (availableRooms.length === 0 || !checkIn || !checkOut) {
      navigate("/#availability")
    }
  }, [availableRooms, checkIn, checkOut, navigate])

  // Handle room selection
  const handleRoomSelection = (roomId, count) => {
    setBookingForm((prev) => ({
      ...prev,
      selectedRooms: {
        ...prev.selectedRooms,
        [roomId]: count,
      },
    }))
  }

  // Validate room selection
  const validateRoomSelection = () => {
    const totalCapacity = availableRooms.reduce((sum, room) => {
      const isDorm = room.type.toLowerCase() === "dorm"
      const currentCount = bookingForm.selectedRooms[room._id] || 0
      return sum + (isDorm ? currentCount : room.capacity * currentCount)
    }, 0)

    if (bookingForm.numberOfGuests > totalCapacity) {
      setBookingError(
        `Selected rooms can only accommodate ${totalCapacity} guests. You requested for ${bookingForm.numberOfGuests} guests.`,
      )
      return false
    }

    if (Object.keys(bookingForm.selectedRooms).length === 0) {
      setBookingError("Please select at least one room to continue.")
      return false
    }

    return true
  }

  // Proceed to booking modal
  const proceedToBooking = () => {
    if (validateRoomSelection()) {
      setIsBookingModalOpen(true)
      setBookingError("")
    }
  }

  // View room details
  const handleViewRoomDetails = (room) => {
    navigate(`/rooms/${room._id}`, {
      state: {
        selectedRoom: room,
        selectedRooms: bookingForm.selectedRooms,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        returnToSelection: true, // Flag to indicate we should return to selection page
        availableRooms: availableRooms, 
        imageUrl: room.imageUrl || "/placeholder.svg", // ✅ Pass imageUrl
        imageUrls: room.imageUrls || [], // Pass all available rooms
        amenities: room.amenities || []
      },
    })
  }

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "Select dates"
    return format(new Date(dateString), "PPP")
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
    return availableRooms.reduce((sum, room) => {
      const count = bookingForm.selectedRooms[room._id] || 0
      return sum + room.price * count * nights
    }, 0)
  }

  return (
      <AnimatedSection animation="slide-up" duration={1000}>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-blue-900 py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Select Your Rooms</h1>
            <p className="text-xl opacity-80 max-w-2xl mx-auto">
              Choose from our available accommodations for your stay from {formatDate(checkIn)} to{" "}
              {formatDate(checkOut)}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-8 mb-4 md:mb-0">
              <div>
                <span className="block text-sm text-gray-500">Check-in</span>
                <span className="font-medium">{formatDate(checkIn)}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Check-out</span>
                <span className="font-medium">{formatDate(checkOut)}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Duration</span>
                <span className="font-medium">
                  {calculateNights()} night{calculateNights() !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="block text-sm text-gray-500">Total Price</span>
                <span className="font-bold text-lg">₹{calculateTotalPrice()}</span>
              </div>

              <Button
                onClick={proceedToBooking}
                variant="custom"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={Object.keys(bookingForm.selectedRooms).length === 0}
              >
                Proceed to Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Selection Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>

        {bookingError && (
          <div className="p-4 mb-6 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
            <div className="font-medium">Booking Error</div>
            <div>{bookingError}</div>
            <button
              onClick={() => setBookingError("")}
              className="mt-2 text-sm text-red-600 underline hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => {
            const isDorm = room.type.toLowerCase() === "dorm"
            const currentCount = bookingForm.selectedRooms[room._id] || 0
            const remainingCapacity = isDorm
              ? room.availability.availableBeds - currentCount
              : room.availability.availableRooms - currentCount

            return (
              <div key={room._id} className="border rounded-lg overflow-hidden shadow-md bg-white">
                {/* Room Image */}
                <div className="relative h-48">
                  <img
                    src={room.imageUrl || "/placeholder.svg?height=200&width=400"}
                    alt={`${room.name || room.type} Room`}
                    className="w-full h-full object-cover"
                  />
                  {room.type && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 text-xs rounded">
                      {room.type}
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{room.name || `${room.type} Room`}</h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm">{room.rating}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-600 text-sm mb-2">
                      {isDorm ? "Shared Room" : "Private Room"} • Sleeps {room.capacity}
                    </p>
                    <p className="text-gray-700 line-clamp-2 text-sm">
                      {room.description ||
                        "Comfortable accommodation with all essential amenities for a pleasant stay."}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="block text-gray-500 text-sm">Price per night</span>
                      <span className="font-bold text-lg">₹{room.price}</span>
                      {isDorm && <span className="text-xs text-gray-500"> per bed</span>}
                    </div>

                    <div>
                      <span className="block text-gray-500 text-sm text-right">Availability</span>
                      <span className="text-sm">
                        {isDorm
                          ? `${room.availability.availableBeds} bed${room.availability.availableBeds !== 1 ? "s" : ""}`
                          : `${room.availability.availableRooms} room${room.availability.availableRooms !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => handleViewRoomDetails(room)}
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      View Details
                    </Button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (currentCount > 0) {
                            handleRoomSelection(room._id, currentCount - 1)
                          }
                        }}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        disabled={currentCount <= 0}
                      >
                        -
                      </button>
                      <span>{currentCount}</span>
                      <button
                        onClick={() => {
                          const maxAvailable = isDorm
                            ? room.availability.availableBeds
                            : room.availability.availableRooms
                          if (currentCount < maxAvailable) {
                            handleRoomSelection(room._id, currentCount + 1)
                          }
                        }}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        disabled={
                          currentCount >= (isDorm ? room.availability.availableBeds : room.availability.availableRooms)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={proceedToBooking}
            variant="custom"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            disabled={Object.keys(bookingForm.selectedRooms).length === 0}
          >
            Proceed to Booking
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          availableRooms={availableRooms}
          handleRoomSelection={handleRoomSelection}
          error={error}
          setError={setError}
          setIsModalOpen={setIsBookingModalOpen}
          setIsBookingConfirmed={setIsBookingConfirmed}
          setBookingDetails={setBookingDetails}
          bookingDetails={bookingDetails}
          setIsBookingFailed={setIsBookingFailed}
          setChecking={setChecking}
        />
      )}
      {isBookingConfirmed && 
        <BookingConfirmationDialog
          isOpen={isBookingConfirmed}
          onClose={() => {
            setIsBookingConfirmed(false);
            navigate("/", { replace: true }); // Replace current history entry with home page
            window.history.pushState(null, null, "/"); // Ensure back button doesn't work
          }}
          booking={bookingDetails}
        />
      }
      {
        isBookingFailed &&
        <BookingFailedDialog // Pass booking details if available
          errorMessage="Payment processing failed. Please try again."
          onClose={() => setIsBookingFailed(false)}
        />
      }
      {
        checking && (
          <CheckingPaymentModal
            isOpen={checking}
          />
        )
      }

      <Footer />
      </AnimatedSection>
  )
}

export default RoomSelectionPage

