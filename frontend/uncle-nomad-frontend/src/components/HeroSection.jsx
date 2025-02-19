import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './HeroSection.css';

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const mediaItems = [
    { type: 'image', src: process.env.PUBLIC_URL + '/hero1.jpeg', duration: 5000 },
    { type: 'image', src: process.env.PUBLIC_URL + '/hero2.jpeg', duration: 5000 },
    { type: 'image', src: process.env.PUBLIC_URL + '/hero3.jpeg', duration: 5000 },
    { type: 'video', src: process.env.PUBLIC_URL + '/video1.mp4' },
    { type: 'video', src: process.env.PUBLIC_URL + '/video2.mp4' }
  ];

  const handleVideoPlay = async () => {
    if (videoRef.current && !isTransitioning) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.log('Video playback failed:', error);
      }
    }
  };

  const handleMediaTransition = useCallback((newIndex) => {
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    // Short delay to ensure DOM updates are complete
    setTimeout(() => {
      if (mediaItems[newIndex].type === 'video') {
        handleVideoPlay();
      }
      setIsTransitioning(false);
    }, 50);
  }, [mediaItems]);

  const handleTouchStart = (e) => {
    if (!isTransitioning) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || isTransitioning) return;
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      const newIndex = diff > 0 
        ? (currentIndex + 1) % mediaItems.length
        : currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
      
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
      if (mediaItems[currentIndex].type === 'image') {
        timer = setTimeout(() => {
          handleMediaTransition((currentIndex + 1) % mediaItems.length);
        }, mediaItems[currentIndex].duration);
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
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        navigate('/admin-auth');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div 
      id='hero' 
      className='hero-container'
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className='hero-overlay'></div>

      {mediaItems[currentIndex].type === 'video' ? (
        <video
          key={currentIndex} // Add key to ensure proper remounting
          ref={videoRef}
          src={mediaItems[currentIndex].src}
          autoPlay
          muted
          className='hero-media'
          preload="metadata"
        />
      ) : (
        <img 
          src={mediaItems[currentIndex].src}
          alt="Uncle Nomad"
          className='hero-media'
          loading="lazy"
        />
      )}

      <div className='hero-content'>
        <h1>ADVENTURE AWAITS</h1>
        <p>What are you waiting for?</p>
        <div className='hero-btns'>
          <Button
            className='btns btn--outline btn--large'
            onClick={() => {
              const availabilitySection = document.getElementById('availability');
              if (availabilitySection) {
                const offset = 80;
                const elementPosition = availabilitySection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
          >
            GET STARTED
          </Button>
        </div>
      </div>

      <div className='carousel-dots'>
        {mediaItems.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
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