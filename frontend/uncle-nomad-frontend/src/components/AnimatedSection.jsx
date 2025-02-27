"use client"

import { useEffect, useRef, useState } from "react"

export default function AnimatedSection({ 
  children, 
  threshold = 0.1,
  animation = "fade", // Options: "fade", "slide-up", "slide-left", "slide-right", "zoom-in"
  delay = 0, // Delay in ms
  duration = 1000 // Duration in ms
}) {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef()
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.unobserve(domRef.current)
        }
      },
      { threshold }
    )

    const currentRef = domRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold])

  // Animation style classes
  const getAnimationClass = () => {
    if (!hasMounted) return "opacity-100"; // Prevents flash on load
    if (!isVisible) {
      switch (animation) {
        case "slide-up":
          return "opacity-0 translate-y-16";
        case "slide-left":
          return "opacity-0 -translate-x-16";
        case "slide-right":
          return "opacity-0 translate-x-16";
        case "zoom-in":
          return "opacity-0 scale-95";
        case "fade":
        default:
          return "opacity-0";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };
  

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform" // Optimizes rendering
      }}
      className={`transition-all ease-out ${getAnimationClass()}`}
    >
      {children}
    </div>
  )
}