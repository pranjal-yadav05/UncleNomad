"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";

export default function AnimatedSection({
  children,
  threshold = 0.1,
  animation = "fade", // Options: "fade", "slide-up", "slide-left", "slide-right", "zoom-in", "flip", "bounce", "rotate", "stagger"
  delay = 0, // Delay in ms
  duration = 1000, // Duration in ms
  staggerChildren = false, // Enable staggered animation for children
  staggerDelay = 100, // Delay between each child in ms
  intensity = 1, // Animation intensity multiplier
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.unobserve(domRef.current);
        }
      },
      { threshold }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  // Animation style classes
  const getAnimationClass = () => {
    if (!hasMounted) return "opacity-100"; // Prevents flash on load
    if (!isVisible) {
      const translateValue = `${16 * intensity}px`;
      const scaleValue = 0.95 - 0.05 * intensity;
      const rotateValue = `${5 * intensity}deg`;

      switch (animation) {
        case "slide-up":
          return `opacity-0 translate-y-[${translateValue}]`;
        case "slide-left":
          return `opacity-0 -translate-x-[${translateValue}]`;
        case "slide-right":
          return `opacity-0 translate-x-[${translateValue}]`;
        case "zoom-in":
          return `opacity-0 scale-[${scaleValue}]`;
        case "flip":
          return "opacity-0 rotateX-90";
        case "bounce":
          return "opacity-0 translate-y-4";
        case "rotate":
          return `opacity-0 rotate-[${rotateValue}]`;
        case "fade":
        default:
          return "opacity-0";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0 rotateX-0";
  };

  // Apply staggered animation to children if enabled
  const processChildren = () => {
    if (!staggerChildren || !isVisible) return children;

    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      return React.cloneElement(child, {
        style: {
          ...child.props.style,
          transitionDelay: `${delay + index * staggerDelay}ms`,
          transitionDuration: `${duration}ms`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "none" : "translateY(20px)",
          transition: "opacity, transform",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
      });
    });
  };

  const getTransitionTiming = () => {
    if (animation === "bounce") return "cubic-bezier(0.34, 1.56, 0.64, 1)"; // Bounce curve
    return "cubic-bezier(0.4, 0, 0.2, 1)"; // Standard easing
  };

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: getTransitionTiming(),
        willChange: "opacity, transform", // Optimizes rendering
      }}
      className={`transition-all ${getAnimationClass()}`}>
      {staggerChildren ? processChildren() : children}
    </div>
  );
}
