import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./HeroSection.css";
import { motion } from "framer-motion";
import axios from "axios";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5, // Delay between elements
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      ("Fetching media..."); // Log the fetch action

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/media`,
          { headers: { "x-api-key": process.env.REACT_APP_API_KEY } }
        ); // Adjust the endpoint as necessary

        setMediaItems(response.data);
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  const handleVideoPlay = async () => {
    if (videoRef.current && !isTransitioning) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.error("Video playback failed:", error);
      }
    }
  };

  const handleMediaTransition = useCallback(
    (newIndex) => {
      setIsTransitioning(true);
      setCurrentIndex(newIndex);

      // Short delay to ensure DOM updates are complete
      setTimeout(() => {
        if (mediaItems[newIndex]?.type === "video") {
          handleVideoPlay();
        }
        setIsTransitioning(false);
      }, 50);
    },
    [mediaItems]
  );

  const handleTouchStart = (e) => {
    if (!isTransitioning) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const optimizedVideoUrl = (url) => {
    return url.replace("/upload/", "/upload/f_auto,q_auto,br_800k/");
  };

  const getVideoThumbnail = (url) => {
    return url.replace("/upload/", "/upload/so_0/").replace(".mp4", ".jpg");
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || isTransitioning) return;

    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      const newIndex =
        diff > 0
          ? (currentIndex + 1) % mediaItems.length
          : currentIndex === 0
          ? mediaItems.length - 1
          : currentIndex - 1;

      handleMediaTransition(newIndex);
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  useEffect(() => {
    let timer;

    if (!isTransitioning) {
      if (mediaItems[currentIndex]?.type === "image") {
        timer = setTimeout(
          () => {
            handleMediaTransition((currentIndex + 1) % mediaItems.length);
          },
          mediaItems[currentIndex].type === "image"
            ? mediaItems[currentIndex].duration * 1000
            : 0
        ); // Convert duration to milliseconds
      } else if (videoRef.current) {
        videoRef.current.onended = () => {
          handleMediaTransition((currentIndex + 1) % mediaItems.length);
        };
      }
    }

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.onended = null;
      }
    };
  }, [currentIndex, isTransitioning, handleMediaTransition, mediaItems.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        navigate("/admin-auth");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div
      id="hero"
      className="hero-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      <div className="hero-overlay"></div>

      {mediaItems.length > 0 &&
        mediaItems[currentIndex] &&
        (mediaItems[currentIndex].type === "video" ? (
          <video
            key={currentIndex} // Add key to ensure proper remounting
            ref={videoRef}
            src={optimizedVideoUrl(mediaItems[currentIndex].url)}
            autoPlay
            muted
            className="hero-media"
            preload="metadata"
            poster={getVideoThumbnail(mediaItems[currentIndex].url)}
          />
        ) : (
          <img
            src={mediaItems[currentIndex].url}
            alt="Uncle Nomad"
            className="hero-media"
            loading="lazy"
          />
        ))}

      <motion.div
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          style={{
            fontFamily: "SeaGardens3DRegular, sans-serif",
            fontStyle: "italic",
            textAlign: "center",
            color: "white",
          }}>
          ADVENTURE AWAITS
        </motion.h1>

        {/* Subtext */}
        <motion.p variants={itemVariants} className="text-white text-lg">
          What are you waiting for?
        </motion.p>

        {/* Button */}
        <motion.div variants={itemVariants} className="hero-btns">
          <Button
            className="btns btn--outline btn--large"
            onClick={() => {
              const availabilitySection = document.getElementById("tours");
              if (availabilitySection) {
                const offset = 80;
                const elementPosition =
                  availabilitySection.getBoundingClientRect().top;
                const offsetPosition =
                  elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }}>
            GET STARTED
          </Button>
        </motion.div>
      </motion.div>

      <div className="carousel-dots">
        {mediaItems.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => {
              if (!isTransitioning) {
                handleMediaTransition(index);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
