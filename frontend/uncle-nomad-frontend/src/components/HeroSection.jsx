import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './HeroSection.css';

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  const mediaItems = [
    { type: 'image', src: process.env.PUBLIC_URL + '/hero1.jpeg', duration: 5000 },
    { type: 'image', src: process.env.PUBLIC_URL + '/hero2.jpeg', duration: 5000 },
    { type: 'image', src: process.env.PUBLIC_URL + '/hero3.jpeg', duration: 5000 },
    { type: 'video', src: process.env.PUBLIC_URL + '/video1.mp4' },
    { type: 'video', src: process.env.PUBLIC_URL + '/video2.mp4' }
  ];

  useEffect(() => {
    let timer;

    if (mediaItems[currentIndex].type === 'image') {
      // For images, use a fixed duration
      timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
      }, mediaItems[currentIndex].duration);
    } else {
      // For videos, wait for the video to end before moving to the next
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.play();
        videoElement.onended = () => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
        };
      }
    }

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div id='hero' className='hero-container'>
      <div className='hero-overlay'></div>

      {mediaItems[currentIndex].type === 'video' ? (
        <video
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
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}