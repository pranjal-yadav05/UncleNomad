
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';


import '../App.css';
import './HeroSection.css';



export default function HeroSection() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaItems = [
    { 
      type: 'image', 
      src: process.env.PUBLIC_URL + '/hero1.jpeg'
    },
    { 
      type: 'image', 
      src: process.env.PUBLIC_URL + '/hero2.jpeg'
    },
    { 
      type: 'image', 
      src: process.env.PUBLIC_URL + '/hero3.jpeg'
    },
    { 
      type: 'video', 
      src: process.env.PUBLIC_URL + '/video1.mp4'
    },
    { 
      type: 'video', 
      src: process.env.PUBLIC_URL + '/video2.mp4'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mediaItems.length]);

  return (
    <div id='hero' className='hero-container'>
      <div className='hero-overlay'></div>
      {mediaItems[currentIndex].type === 'video' ? (


        <video 
          src={mediaItems[currentIndex].src} 
          autoPlay 
          loop 
          muted 
          className='hero-media'
          poster=""
          preload="metadata"
        />
      ) : (
        <img 
          src={mediaItems[currentIndex].src} 
          alt="Uncle Nomad" 
          className='hero-media'
          loading="lazy"
          srcSet={`${mediaItems[currentIndex].src} 1200w`}
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
                const offset = 80; // Adjust this value based on your navbar height
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
