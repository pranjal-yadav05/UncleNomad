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
import AnimatedSection from "../components/AnimatedSection";
import ParallaxSection from "../components/ParallaxSection";
import MouseTracker from "../components/MouseTracker";
import ScrollProgress from "../components/ScrollProgress";
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
        console.log(data);
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
    <MouseTracker
      enabled={true}
      effectOpacity={0.2}
      effectBlur={80}
      effectColor="rgba(65, 105, 225, 0.15)">
      <div className="min-h-screen bg-gray-50">
        <ScrollProgress color="#6366f1" height={4} showPercentage={true} />
        <Header />

        <main className="flex flex-col relative">
          {/* HeroSection */}
          <div className="relative">
            <HeroSection />
          </div>

          {/* Tour Section with Parallax */}
          <ParallaxSection
            backgroundImage="tourback.jpg"
            speed={0.4}
            overlay={true}
            overlayOpacity={0.8}
            minHeight="auto"
            className="py-0 relative z-10">
            <AnimatedSection
              animation="slide-up"
              duration={1200}
              intensity={1.2}>
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

              <AnimatedSection animation="fade" delay={300} duration={1500}>
                <CounterSection stats={stats} />
              </AnimatedSection>
            </AnimatedSection>
          </ParallaxSection>

          <AnimatedSection
            animation="slide-right"
            duration={1400}
            threshold={0.2}
            className="relative z-20">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative pt-10">
              <div id="availability" ref={roomsRef}>
                <AvailableRooms
                  availableRooms={rooms}
                  handleBookNowClick={handleBookNowClick}
                  isLoading={isLoading.rooms}
                />
              </div>

              <AnimatedSection animation="bounce" delay={200} duration={1000}>
                <GoogleReviews />
              </AnimatedSection>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="flip"
            duration={1200}
            threshold={0.15}
            staggerChildren={true}
            staggerDelay={150}
            className="relative z-30">
            <AboutSection />
          </AnimatedSection>

          <AnimatedSection
            animation="slide-up"
            duration={800}
            className="relative z-40">
            <div id="footer">
              <Footer />
            </div>
          </AnimatedSection>
        </main>
      </div>
    </MouseTracker>
  );
}
