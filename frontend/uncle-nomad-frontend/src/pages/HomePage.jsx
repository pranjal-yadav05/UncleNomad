"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import AvailabilitySection from "../components/AvailabilitySection";
import AboutSection from "../components/AboutSection";
import Footer from "../components/Footer";
import TourSection from "../components/TourSection";
import AvailableRooms from "../components/AvailableRooms";
import CounterSection from "../components/CounterSection";
import AnimatedSection from "../components/AnimatedSection"; // Import enhanced component
import GoogleReviews from "../components/GoogleReviews";
import { useLocation, useNavigate } from "react-router-dom";

export default function HomePage() {
  // Your existing state and functions
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;
  const [tours, setTours] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({
    destinations: "loading...",
  });

  const [isLoading, setIsLoading] = useState({
    rooms: true,
    tours: true,
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const roomsRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.state?.section) {
      const scrollToSection = () => {
        if (location.state.section === "footer") {
          // Scroll to the very bottom of the page
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
          return;
        }

        const section = document.getElementById(location.state.section);
        if (section) {
          const offset = 80; // Default offset for header
          const elementPosition =
            section.getBoundingClientRect().top + window.scrollY;
          let offsetPosition = elementPosition - offset;

          // Ensure we don't scroll past the bottom of the page
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          if (offsetPosition > maxScroll) {
            offsetPosition = maxScroll;
          }

          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      };

      // Try scrolling immediately
      scrollToSection();

      // Observe for late rendering
      const observer = new MutationObserver(() => {
        if (
          document.getElementById(location.state.section) ||
          location.state.section === "footer"
        ) {
          scrollToSection();
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [location]);

  useEffect(() => {
    fetchStats();
  }, []);

  // const categories = ["all", "adventure", "cultural", "beach", "mountain", "city"]
  const fetchStats = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/tours/stats`,
      { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
    );
    const data = await res.json();
    setStats(data);
  };

  // Your existing useEffect and functions
  useEffect(() => {
    // Fetch tours and guides data
    fetch(`${API_URL}/api/tours`, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        // Check if data has a tours property (new API format) or if it's an array directly (old format)
        const toursArray = data.tours || data;
        setTours(Array.isArray(toursArray) ? toursArray : []);
        setIsLoading((prev) => ({ ...prev, tours: false }));
      })
      .catch((error) => {
        console.error("Error fetching tours:", error);
        setIsLoading((prev) => ({ ...prev, tours: false }));
      });

    fetch(`${API_URL}/api/rooms`, {
      headers: { "x-api-key": process.env.REACT_APP_API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setIsLoading((prev) => ({ ...prev, rooms: false }));
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
        setIsLoading((prev) => ({ ...prev, rooms: false }));
      });
  }, []);

  const handleBookNowClick = (room) => {
    navigate("/availability");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* HeroSection doesn't need animation as it's the first thing visitors see */}
        <HeroSection />

        <AnimatedSection animation="slide-up" duration={1000}>
          <div
            className="relative"
            style={{
              backgroundImage: "url('tourback.jpg')", // Add the background image path here
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div id="tours">
              <TourSection
                setStats={setStats}
                stats={stats}
                setIsBookingModalOpen={setIsBookingModalOpen}
                isBookingModalOpen={isBookingModalOpen}
                tours={tours}
                isLoading={isLoading.tours}
              />
            </div>

            <CounterSection stats={stats} />
          </div>
        </AnimatedSection>

        <AnimatedSection animation="slide-up" duration={1200}>
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            {/* <div className="absolute inset-0 bg-black/30"></div> */}
            <div id="availability" ref={roomsRef}>
              <AvailableRooms
                availableRooms={rooms}
                handleBookNowClick={handleBookNowClick}
                isLoading={isLoading.rooms}
              />
            </div>
            <GoogleReviews />
          </div>
        </AnimatedSection>

        {/* Use different animation styles for each section */}
        <AnimatedSection animation="fade" duration={1200}>
          <AboutSection />
        </AnimatedSection>
      </main>
      <div id="footer">
        <Footer />
      </div>
    </div>
  );
}
