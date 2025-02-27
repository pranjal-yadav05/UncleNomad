"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import CheckingPaymentModal from "../modals/CheckingPaymentModal"
import { useNavigate } from "react-router-dom"

const initialBookingForm = {
  selectedRooms: {},
  guestName: "",
  email: "",
  phone: "",
  numberOfGuests: 1,
  numberOfChildren: 0,
  mealIncluded: false,
  extraBeds: 0,
  specialRequests: "",
  checkIn: null,
  checkOut: null,
}

function AvailabilitySection() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [bookingForm, setBookingForm] = useState(initialBookingForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dateError, setDateError] = useState("")

  const handleDateChange = (e) => {
    const { name, value } = e.target

    setBookingForm((prev) => ({
      ...prev,
      [name]: new Date(value),
    }))
  }

  const checkAvailability = async () => {
    const { checkIn, checkOut } = bookingForm
    if (checkIn && checkOut) {
      setDateError("")
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/bookings/check-availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`,
        )

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(errorData || "Failed to check availability")
        }

        const data = await response.json()

        // Process availability data from backend
        const availableRooms = data
          .map((room) => ({
            ...room,
            availability: {
              availableBeds: room.type === "Dorm" ? room.availability.availableBeds : null,
              availableRooms: room.type !== "Dorm" ? room.availability.availableRooms : null,
              totalBeds: room.type === "Dorm" ? room.capacity : null,
              totalRooms: room.type !== "Dorm" ? room.totalRooms : null,
            },
            imageUrl: room.imageUrl, // ✅ Ensure main image exists
            imageUrls: room.imageUrls || [],
            amenities: room.amenities || []
          }))
          .filter(
            (room) =>
              (room.type === "Dorm" && room.availability.availableBeds > 0) ||
              (room.type !== "Dorm" && room.availability.availableRooms > 0),
          )

        if (availableRooms.length === 0) {
          throw new Error("No rooms available for the selected dates")
        }

        console.log("Available rooms:", availableRooms)

        // Navigate to the room selection page with available rooms
        navigate("/room-selection", {
          state: {
            availableRooms: availableRooms,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
          },
        })
      } catch (error) {
        console.error("Error fetching available rooms:", error)
        setError(error.message || "Failed to check availability. Please try again.")
      } finally {
        setLoading(false)
      }
    } else {
      setDateError("Please select valid dates")
    }
  }

  const renderStep1 = () => (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl max-w-lg mx-auto animate-fade-in">
      {/* Step Title */}
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-semibold text-white">Select Your Dates</h3>
        <p className="text-gray-300 text-sm">Find the best room availability for your stay</p>
      </div>

      {/* Error Message */}
      {dateError !== "" && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          <div>{dateError}</div>
        </div>
      )}

      {/* Date Selection Fields */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label htmlFor="checkIn" className="block text-sm font-medium mb-1 text-white">
            Check-in
          </label>
          <input
            type="date"
            id="checkIn"
            name="checkIn"
            value={bookingForm.checkIn?.toISOString().split("T")[0] || ""}
            onChange={handleDateChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full p-3 border border-white/20 rounded-md bg-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="checkOut" className="block text-sm font-medium mb-1 text-white">
            Check-out
          </label>
          <input
            type="date"
            id="checkOut"
            name="checkOut"
            value={bookingForm.checkOut?.toISOString().split("T")[0] || ""}
            onChange={handleDateChange}
            min={bookingForm.checkIn?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}
            className="w-full p-3 border border-white/20 rounded-md bg-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50"
            required
          />
        </div>
      </div>

      {/* Check Availability Button */}
      <Button
        variant="custom"
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 mt-6 py-3 rounded-lg shadow-lg"
        onClick={checkAvailability}
        disabled={loading}
        id="checkbtn"
      >
        {loading ? "Checking..." : "Check Availability"}
      </Button>
    </div>
  )

  return (
    <Card
      className="py-12 bg-gray-50 relative flex items-center justify-center"
      id="availability"
      style={{
        backgroundImage: 'url("availability.jpg")', // Replace with your background image URL
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "700px",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Centered Content Wrapper */}
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center min-h-[700px]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-6 drop-shadow-lg">Check Availability</h2>
          {renderStep1()}

          <CheckingPaymentModal open={checking} />
        </div>
      </div>
    </Card>
  )
}

export default AvailabilitySection

