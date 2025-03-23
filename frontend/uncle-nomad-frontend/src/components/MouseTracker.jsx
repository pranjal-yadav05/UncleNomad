"use client";

import { useState, useEffect } from "react";

export default function MouseTracker({
  children,
  enabled = true,
  effectSize = 300,
  effectOpacity = 0.3,
  effectColor = "rgba(255, 255, 255, 0.1)",
  effectBlur = 50,
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled]);

  return (
    <div className="relative overflow-hidden">
      {/* Cursor effect */}
      {enabled && isActive && (
        <div
          className="pointer-events-none fixed z-10 rounded-full transition-transform duration-300 ease-out"
          style={{
            left: position.x,
            top: position.y,
            width: effectSize,
            height: effectSize,
            transform: "translate(-50%, -50%)",
            background: effectColor,
            opacity: effectOpacity,
            filter: `blur(${effectBlur}px)`,
            willChange: "left, top",
          }}
        />
      )}

      {/* Content */}
      {children}
    </div>
  );
}
