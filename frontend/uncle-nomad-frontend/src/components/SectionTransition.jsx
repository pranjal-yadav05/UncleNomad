import React, { useEffect, useState } from "react";

const SectionTransition = ({
  type = "overlap", // overlap, split, fade, reveal, diagonal
  bgFrom = "#000000",
  bgTo = "#ffffff",
  height = 120,
  angle = 10, // Used for diagonal transitions (degrees)
  withPattern = false, // Add subtle geometric pattern
  withParallax = false, // Add parallax effect
  patternColor = "rgba(255, 255, 255, 0.05)",
  className = "",
}) => {
  const [parallaxOffset, setParallaxOffset] = useState(0);

  // Parallax effect
  useEffect(() => {
    if (!withParallax) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = scrollY * 0.15; // Adjust speed as needed
      setParallaxOffset(offset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [withParallax]);

  // Generate diagonal clip path
  const getDiagonalPath = () => {
    return `polygon(0 0, 100% ${100 - angle}%, 100% 100%, 0 ${angle}%)`;
  };

  // Generate random dot pattern for texture
  const generateDotPattern = () => {
    const dots = [];
    const count = 60; // Number of dots

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 6 + 2; // 2-8px
      const opacity = Math.random() * 0.15 + 0.05; // 0.05-0.2
      const top = Math.random() * 100;
      const left = Math.random() * 100;

      dots.push(
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: patternColor,
            opacity,
            top: `${top}%`,
            left: `${left}%`,
            transform: `translateZ(0)`,
          }}
        />
      );
    }

    return dots;
  };

  // Render transition based on type
  const renderTransition = () => {
    switch (type) {
      case "overlap":
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            {/* Top section */}
            <div
              className="absolute top-0 left-0 w-full h-3/4 z-10"
              style={{
                backgroundColor: bgFrom,
                borderBottomLeftRadius: "50%",
                borderBottomRightRadius: "50%",
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.3}px)`
                  : "none",
              }}
            />

            {/* Bottom section */}
            <div
              className="absolute bottom-0 left-0 w-full h-3/4 z-0"
              style={{
                backgroundColor: bgTo,
                transform: withParallax
                  ? `translateY(${-parallaxOffset * 0.2}px)`
                  : "none",
              }}
            />

            {withPattern && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );

      case "layered":
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            {/* Base layer */}
            <div
              className="absolute inset-0 z-0"
              style={{ backgroundColor: bgTo }}
            />

            {/* Multiple layered strips */}
            <div
              className="absolute left-0 right-0 h-1/2 top-0 z-10"
              style={{
                backgroundColor: bgFrom,
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.2}px)`
                  : "none",
                clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 100%)",
              }}
            />

            <div
              className="absolute left-0 w-3/4 h-3/4 top-0 z-20"
              style={{
                backgroundColor: bgTo,
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.4}px)`
                  : "none",
                clipPath: "polygon(0 0, 100% 20%, 75% 100%, 0 80%)",
                opacity: 0.7,
              }}
            />

            <div
              className="absolute right-0 w-1/2 h-3/5 top-1/3 z-30"
              style={{
                backgroundColor: bgFrom,
                transform: withParallax
                  ? `translateY(${parallaxOffset * -0.3}px)`
                  : "none",
                clipPath: "polygon(30% 0, 100% 40%, 100% 100%, 0 100%)",
                opacity: 0.5,
              }}
            />

            {withPattern && (
              <div className="absolute inset-0 z-40 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );

      case "split":
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            {/* Left section */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full z-10"
              style={{
                backgroundColor: bgFrom,
                transform: withParallax
                  ? `translateX(${-parallaxOffset * 0.3}px)`
                  : "none",
              }}
            />

            {/* Right section */}
            <div
              className="absolute top-0 right-0 w-1/2 h-full z-10"
              style={{
                backgroundColor: bgTo,
                transform: withParallax
                  ? `translateX(${parallaxOffset * 0.3}px)`
                  : "none",
              }}
            />

            {/* Center line */}
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-full bg-white z-20"
              style={{
                background: `linear-gradient(to right, ${bgFrom} 0%, ${bgTo} 100%)`,
              }}
            />

            {withPattern && (
              <div className="absolute inset-0 z-30 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );

      case "fade":
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            <div
              className="absolute inset-0 z-10"
              style={{
                background: `linear-gradient(to bottom, ${bgFrom} 0%, ${bgTo} 100%)`,
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.2}px)`
                  : "none",
              }}
            />

            {withPattern && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );

      case "reveal":
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            {/* Bottom layer */}
            <div
              className="absolute inset-0 z-0"
              style={{ backgroundColor: bgTo }}
            />

            {/* Top layer with pattern cutouts */}
            <div
              className="absolute inset-0 z-10"
              style={{
                backgroundColor: bgFrom,
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.2}px)`
                  : "none",
              }}>
              {/* Circle cutouts */}
              <div
                className="absolute left-1/4 bottom-0 w-32 h-16 rounded-t-full"
                style={{ backgroundColor: bgTo }}
              />
              <div
                className="absolute left-1/2 bottom-0 w-64 h-32 rounded-t-full"
                style={{ backgroundColor: bgTo }}
              />
              <div
                className="absolute right-1/6 bottom-0 w-16 h-8 rounded-t-full"
                style={{ backgroundColor: bgTo }}
              />
              <div
                className="absolute left-3/4 bottom-0 w-24 h-12 rounded-t-full"
                style={{ backgroundColor: bgTo }}
              />
            </div>

            {withPattern && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );

      case "diagonal":
      default:
        return (
          <div className="relative w-full overflow-hidden" style={{ height }}>
            {/* Bottom layer */}
            <div
              className="absolute inset-0 z-0"
              style={{ backgroundColor: bgTo }}
            />

            {/* Top diagonal layer */}
            <div
              className="absolute inset-0 z-10 transform origin-top-left"
              style={{
                backgroundColor: bgFrom,
                clipPath: getDiagonalPath(),
                transform: withParallax
                  ? `translateY(${parallaxOffset * 0.2}px)`
                  : "none",
              }}
            />

            {withPattern && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                {generateDotPattern()}
              </div>
            )}
          </div>
        );
    }
  };

  return <div className={`w-full ${className}`}>{renderTransition()}</div>;
};

export default SectionTransition;
