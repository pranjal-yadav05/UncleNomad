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
  const [videoLoaded, setVideoLoaded] = useState(false);
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

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };

  const handleMediaTransition = useCallback(
    (newIndex) => {
      setIsTransitioning(true);
      setCurrentIndex(newIndex);
      setVideoLoaded(false);

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

  // Preload next media item
  useEffect(() => {
    if (mediaItems.length > 1) {
      const nextIndex = (currentIndex + 1) % mediaItems.length;
      const nextItem = mediaItems[nextIndex];

      if (nextItem && nextItem.type === "video") {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = optimizedVideoUrl(nextItem.url);
        link.as = "video";
        document.head.appendChild(link);

        // Also preload the thumbnail
        const imgPreload = new Image();
        imgPreload.src = getVideoThumbnail(nextItem.url);

        return () => {
          document.head.removeChild(link);
        };
      } else if (nextItem && nextItem.type === "image") {
        const imgPreload = new Image();
        imgPreload.src = nextItem.url;
      }
    }
  }, [currentIndex, mediaItems]);

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
          <>
            {!videoLoaded && (
              <img
                src={getVideoThumbnail(mediaItems[currentIndex].url)}
                alt="Video Thumbnail"
                className="hero-media"
              />
            )}
            <video
              key={currentIndex}
              ref={videoRef}
              src={optimizedVideoUrl(mediaItems[currentIndex].url)}
              autoPlay
              muted
              className={`hero-media ${
                videoLoaded ? "opacity-100" : "opacity-0"
              }`}
              preload="auto"
              poster={getVideoThumbnail(mediaItems[currentIndex].url)}
              onLoadedData={handleVideoLoaded}
            />
          </>
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
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-white">
            Adventure Awaits
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p variants={itemVariants} className="text-white text-lg">
          What are you waiting for?
        </motion.p>

        {/* Button */}
        <motion.div variants={itemVariants} className="hero-btns">
          <Button
            variant="outline"
            className="btns btn--outline btn--large text-white hover:bg-white/10 border-white/20"
            onClick={() => {
              const availabilitySection = document.getElementById("tours");
              if (availabilitySection) {
                const offset = 80;
                const elementPosition =
                  availabilitySection.getBoundingClientRect().top;
                const offsetPosition =
                  elementPosition + window.pageYOffset - offset + 100;

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
