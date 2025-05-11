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

// Separator component for visual distinction between white sections
const SectionSeparator = ({ type = "gradient" }) => {
  if (type === "gradient") {
    return (
      <div className="py-16">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
      </div>
    );
  } else if (type === "curve") {
    return (
      <div className="w-full overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="w-full h-20">
          <path
            fill="#f3f4f6"
            d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,74.7C1120,75,1280,53,1360,42.7L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>
    );
  } else if (type === "ornament") {
    return (
      <div className="flex justify-center py-16">
        <div className="flex items-center">
          <div className="h-px w-16 bg-gray-200"></div>
          <div className="mx-4 text-indigo-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="h-px w-16 bg-gray-200"></div>
        </div>
      </div>
    );
  } else if (type === "shadow") {
    return (
      <div className="py-12">
        <div className="h-1 mx-auto w-4/5 max-w-3xl rounded-full bg-gradient-to-r from-white via-gray-200 to-white shadow-sm"></div>
      </div>
    );
  } else if (type === "divider") {
    return (
      <div className="py-16">
        <div className="flex justify-center items-center">
          <div className="h-px w-1/3 bg-gray-100"></div>
          <div className="px-4">
            <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
          </div>
          <div className="h-px w-1/3 bg-gray-100"></div>
        </div>
      </div>
    );
  }
};

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
          let offsetPosition = elementPosition - offset + 100;

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

  const fetchStats = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/tours/stats`,
      { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
    );
    const data = await res.json();
    console.log(data);
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

          {/* Tour Section */}
          <AnimatedSection animation="slide-up" duration={1200} intensity={1.2}>
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
          </AnimatedSection>

          {/* Separator between Tour Section and Counter Section */}
          <SectionSeparator type="ornament" />

          {/* Counter Section - now directly in the page with white background */}
          <AnimatedSection animation="fade" delay={300} duration={1500}>
            <CounterSection stats={stats} />
          </AnimatedSection>

          {/* Separator between Counter Section and Available Rooms */}
          <SectionSeparator type="divider" />

          <AnimatedSection
            animation="slide-right"
            duration={1400}
            threshold={0.2}
            className="relative z-20">
            <div className="bg-white text-black relative pt-10">
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

          {/* Separator between Google Reviews and About Section */}
          <SectionSeparator type="curve" />

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
