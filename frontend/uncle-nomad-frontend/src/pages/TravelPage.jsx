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
import { useLocation, useNavigate } from "react-router-dom"

export default function TravelPage() {
  // Your existing state and functions
  const navigate = useNavigate()
  const API_URL = process.env.REACT_APP_API_URL;
  const [tours, setTours] = useState([])
  const [rooms, setRooms] = useState([])
 
  const [isLoading, setIsLoading] = useState({
    property: true,
    tours: true,
    guides: true,
    booking: false,
  })
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  
  const roomsRef = useRef(null)

  const location = useLocation();

  useEffect(() => {
    if (location.state?.section) {
      setTimeout(() => {
        const section = document.getElementById(location.state.section);
        if (section) {
          const offset = 120;
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
    fetch(`${API_URL}/api/tours`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}})
      .then((res) => res.json())
      .then((data) => {
        setTours(data)
        ('tours',data)
        setIsLoading((prev) => ({ ...prev, tours: false }))
      })
      .catch((error) => console.error("Error fetching tours:", error))
    
    fetch(`${API_URL}/api/rooms`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}})
    .then((res) => res.json())
    .then((data) => {
      setRooms(data)
      setIsLoading((prev) => ({ ...prev, property: false, rooms: false }))
      })
      .catch((error) => console.error("Error fetching rooms:", error))

  }, [])


  const handleBookNowClick = (room) => {
    navigate('/availability');
  };
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* HeroSection doesn't need animation as it's the first thing visitors see */}
        <HeroSection
        />
        
        {/* Use different animation styles for each section */}
        <AnimatedSection animation="fade" duration={1200}>
          <AboutSection />
        </AnimatedSection>

        <AnimatedSection animation="slide-up" duration={1000}>
        <div
          className="relative"
          style={{
            backgroundImage: "url('tourback.jpg')", // Add the background image path here
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <TourSection
            setIsBookingModalOpen={setIsBookingModalOpen} 
            isBookingModalOpen={isBookingModalOpen} 
            tours={tours}
          />
          <CounterSection/>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="slide-up" duration={1200}>
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            {/* <div className="absolute inset-0 bg-black/30"></div> */}
            <div id="availability" ref={roomsRef}>
              <AvailableRooms 
                availableRooms={rooms} 
                handleBookNowClick={handleBookNowClick} 
                isLoading={isLoading}
              />
            </div>
            <GoogleReviews/>
          </div>
        </AnimatedSection>
            
      </main>

      <Footer />
    </div>
  )
}