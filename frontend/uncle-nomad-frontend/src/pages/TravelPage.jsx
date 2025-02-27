"use client"

import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import HeroSection from "../components/HeroSection"
import AvailabilitySection from "../components/AvailabilitySection"
import AboutSection from "../components/AboutSection"
import Footer from "../components/Footer"
import TourSection from "../components/TourSection"
import AvailableRooms from "../components/AvailableRooms"
import CounterSection from "../components/CounterSection"
import AnimatedSection from "../components/AnimatedSection" // Import enhanced component
import GoogleReviews from "../components/GoogleReviews"
import { useLocation } from "react-router-dom"

export default function TravelPage() {
  // Your existing state and functions
  const API_URL = process.env.REACT_APP_API_URL;
  const [tours, setTours] = useState([])
  const [rooms, setRooms] = useState([])
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

  const location = useLocation();

  useEffect(() => {
    if (location.state?.section) {
      setTimeout(() => {
        const section = document.getElementById(location.state.section);
        if (section) {
          const offset = 80;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 100); // Timeout ensures the DOM has loaded
    }
  }, [location]);

  // Your existing useEffect and functions
  useEffect(() => {
    // Fetch tours and guides data
    fetch(`${API_URL}/api/tours`)
      .then((res) => res.json())
      .then((data) => {
        setTours(data)
        console.log('tours',data)
        setIsLoading((prev) => ({ ...prev, tours: false }))
      })
      .catch((error) => console.error("Error fetching tours:", error))
    
    fetch(`${API_URL}/api/rooms`)
    .then((res) => res.json())
    .then((data) => {
      setRooms(data)
      setIsLoading((prev) => ({ ...prev, property: false, rooms: false }))
      })
      .catch((error) => console.error("Error fetching rooms:", error))

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
    const availabilitySection = document.getElementById("availability");
    const section = document.getElementById('checkbtn')
    if (availabilitySection) {
      const offset = 100;
      const elementPosition = availabilitySection.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      section.classList.add('highlight2');
      setTimeout(() => {
        section.classList.remove('highlight2');
      }, 2000);
    }
  };
  
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
        {/* HeroSection doesn't need animation as it's the first thing visitors see */}
        <HeroSection
          bookingDates={bookingDates}
          setBookingDates={setBookingDates}
          checkAvailability={checkAvailability}
        />
        
        {/* Use different animation styles for each section */}
        <AnimatedSection animation="fade" duration={1200}>
          <AboutSection />
        </AnimatedSection>

        <AnimatedSection animation="slide-up" duration={1000}>
          <AvailabilitySection />
        </AnimatedSection>

        <AnimatedSection animation="slide-up" duration={1200}>
          <div ref={roomsRef}>
            <AvailableRooms 
              availableRooms={rooms} 
              handleBookNowClick={handleBookNowClick} 
              isLoading={isLoading}
            />
          </div>
        </AnimatedSection>
        <div
          className="relative"
          style={{
            backgroundImage: "url('tourback.jpeg')", // Add the background image path here
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-50"></div>

              <TourSection
                setIsBookingModalOpen={setIsBookingModalOpen} 
                isBookingModalOpen={isBookingModalOpen} 
                tours={tours}
              />

            <AnimatedSection animation="zoom-in" duration={800}>
              <CounterSection/>
            </AnimatedSection>
            
        </div>
        <AnimatedSection animation="zoom-in" duration={800}>
              <GoogleReviews/>
            </AnimatedSection>
            
      </main>

      <Footer />
    </div>
  )
}