"use client"

import { useState, useEffect, useRef } from "react"
import Header from "./Header"
import HeroSection from "./HeroSection"
import AvailabilitySection from "./AvailabilitySection"
import TourCard from "./TourCard"
import TourDetailsModal from "./TourDetailsModal"
import AboutSection from "./AboutSection"
import BookingModal from "./BookingModal"
import TourBookingModal from "./TourBookingModal"
import GuideBookingModal from "./GuideBookingModal"
import BookingConfirmationDialog from "./BookingConfirmationDialog"
import Footer from "./Footer"
import TourGuides from "./TourGuides"
import TourSection from "./TourSection"

export default function TravelPage() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [property, setProperty] = useState(null)
  const [tours, setTours] = useState([])
  const [guides, setGuides] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])

  const [bookingDates, setBookingDates] = useState({
    checkIn: "",
    checkOut: "",
  })
  const [isLoading, setIsLoading] = useState({
    property: true,
    tours: true,
    guides: true,
    booking: false,
  })
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    email: "",
    phone: "",
    numberOfGuests: 1,
    specialRequests: "",
  })
  const [bookingConfirmation, setBookingConfirmation] = useState(null)
  
  const [selectedGuide, setSelectedGuide] = useState(null)
  
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const roomsRef = useRef(null)

  useEffect(() => {
    // Fetch property data
    fetch(`${API_URL}/api/property`)
      .then((res) => res.json())
      .then((data) => {
        setProperty(data)
        setIsLoading((prev) => ({ ...prev, property: false }))
      })
      .catch((error) => console.error("Error fetching property:", error))

    // Fetch tours and guides data
    fetch(`${API_URL}/api/tours`)
      .then((res) => res.json())
      .then((data) => {
        setTours(data)
        setIsLoading((prev) => ({ ...prev, tours: false }))
      })
      .catch((error) => console.error("Error fetching tours:", error))

    fetch(`${API_URL}/api/guides`)
      .then((res) => res.json())
      .then((data) => {
        setGuides(data)
        setIsLoading((prev) => ({ ...prev, guides: false }))
      })
      .catch((error) => console.error("Error fetching guides:", error))
  }, [])

  const checkAvailability = async () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      alert("Please select check-in and check-out dates")
      return
    }

    setIsCheckingAvailability(true)

    try {
      const response = await fetch(
        `${API_URL}/api/rooms/availability?checkIn=${bookingDates.checkIn}&checkOut=${bookingDates.checkOut}`,
      )
      const data = await response.json()
      setAvailableRooms(data)

      if (data.length > 0 && roomsRef.current) {
        roomsRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    } catch (error) {
      console.error("Error checking availability:", error)
    }
    finally {
      setIsCheckingAvailability(false)
    }
  }

  const handleBookNowClick = (room) => {
    setSelectedRoom(room)
    setIsBookingModalOpen(true)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setIsLoading((prev) => ({ ...prev, booking: true }))

    try {
      const response = await fetch(`${API_URL}/api/rooms/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          checkIn: bookingDates.checkIn,
          checkOut: bookingDates.checkOut,
          ...bookingForm,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setBookingConfirmation(data)
        // Clear form and close modal after successful booking
        setBookingForm({
          guestName: "",
          email: "",
          phone: "",
          numberOfGuests: 1,
          specialRequests: "",
        })
        setIsBookingModalOpen(false)
      } else {
        alert(data.message || "Error making booking")
      }
    } catch (error) {
      console.error("Error making booking:", error)
      alert("Error making booking. Please try again.")
    } finally {
      setIsLoading((prev) => ({ ...prev, booking: false }))
    }
  }

  const handleGuideBooking = (guide) => {
    setSelectedGuide(guide)
    setIsGuideModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <HeroSection
          bookingDates={bookingDates}
          setBookingDates={setBookingDates}
          checkAvailability={checkAvailability}
        />
        
        <AboutSection />

        <AvailabilitySection />

        <TourSection
          setIsBookingModalOpen={setIsBookingModalOpen} 
          isBookingModalOpen={isBookingModalOpen} 
          tours={tours}
        />

      </main>

      <Footer />
    </div>
  )
}
