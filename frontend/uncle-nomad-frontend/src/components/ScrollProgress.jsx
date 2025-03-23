"use client";

import { useState, useEffect } from "react";

export default function ScrollProgress({
  color = "#4f46e5",
  height = 3,
  position = "top", // top, bottom
  zIndex = 1000,
  showPercentage = false,
  className = "",
}) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      setScrollProgress(scrollPercent < 0 ? 0 : scrollPercent);
    };

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress(); // Initialize on mount

    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  const progressStyle = {
    width: `${scrollProgress * 100}%`,
    height,
    backgroundColor: color,
    position: "fixed",
    left: 0,
    [position]: 0,
    zIndex,
    transition: "width 0.2s ease-out",
  };

  const percentageStyle = {
    position: "fixed",
    [position === "top" ? "top" : "bottom"]: height + 5,
    right: 20,
    backgroundColor: color,
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "12px",
    fontWeight: "bold",
    zIndex,
    transition: "opacity 0.3s ease",
  };

  return (
    <>
      <div style={progressStyle} className={className} />

      {showPercentage && scrollProgress > 0 && (
        <div style={percentageStyle}>{Math.round(scrollProgress * 100)}%</div>
      )}
    </>
  );
}
