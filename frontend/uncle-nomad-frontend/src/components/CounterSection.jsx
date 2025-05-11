import { useState, useEffect, useRef } from "react";
import AnimatedCounter from "./AnimatedCounter";

const CounterSection = ({ stats }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePosition({ x, y });
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener("mousemove", handleMouseMove);
      section.addEventListener("mouseenter", () => setIsHovering(true));
      section.addEventListener("mouseleave", () => setIsHovering(false));
    }

    return () => {
      if (section) {
        section.removeEventListener("mousemove", handleMouseMove);
        section.removeEventListener("mouseenter", () => setIsHovering(true));
        section.removeEventListener("mouseleave", () => setIsHovering(false));
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center min-h-screen bg-white py-24 md:py-32 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated compass rose that follows mouse */}
        <div
          className="absolute w-96 h-96 opacity-5 transition-all duration-1000 ease-out"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="%234f46e5" stroke-width="1"/><circle cx="100" cy="100" r="70" fill="none" stroke="%234f46e5" stroke-width="0.5"/><line x1="100" y1="10" x2="100" y2="50" stroke="%234f46e5" stroke-width="2"/><line x1="100" y1="150" x2="100" y2="190" stroke="%234f46e5" stroke-width="2"/><line x1="10" y1="100" x2="50" y2="100" stroke="%234f46e5" stroke-width="2"/><line x1="150" y1="100" x2="190" y2="100" stroke="%234f46e5" stroke-width="2"/><text x="100" y="25" text-anchor="middle" fill="%234f46e5" font-size="12">N</text><text x="100" y="180" text-anchor="middle" fill="%234f46e5" font-size="12">S</text><text x="25" y="104" text-anchor="middle" fill="%234f46e5" font-size="12">W</text><text x="175" y="104" text-anchor="middle" fill="%234f46e5" font-size="12">E</text><path d="M100,100 L120,60 L100,80 L80,60 Z" fill="%234f46e5"/></svg>\')',
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            transform: isHovering
              ? `translate(${mousePosition.x - 192}px, ${
                  mousePosition.y - 192
                }px) rotate(${mousePosition.x / 20}deg)`
              : "translate(-50%, -50%) rotate(0deg)",
            left: "50%",
            top: "50%",
            filter: "blur(1px)",
            willChange: "transform",
          }}
        />

        {/* Achievement stars that appear on hover */}
        {isHovering && (
          <>
            <div
              className="absolute w-8 h-8 text-indigo-400 animate-pulse"
              style={{
                backgroundImage:
                  'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%234f46e5" stroke="%234f46e5" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\')',
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                top: `${mousePosition.y / 2}px`,
                left: `${mousePosition.x / 3 + 100}px`,
                opacity: 0.3,
                transform: `scale(${
                  0.5 + (Math.sin(Date.now() / 1000) + 1) / 4
                })`,
                transition: "all 1s ease-out",
              }}
            />
            <div
              className="absolute w-12 h-12 text-purple-400 animate-pulse"
              style={{
                backgroundImage:
                  'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23a855f7" stroke="%23a855f7" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\')',
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                bottom: `${mousePosition.y / 3 + 50}px`,
                right: `${mousePosition.x / 4 + 50}px`,
                opacity: 0.2,
                transform: `scale(${
                  0.5 + (Math.cos(Date.now() / 1200) + 1) / 4
                })`,
                transition: "all 1.2s ease-out",
              }}
            />
            <div
              className="absolute w-10 h-10 text-indigo-400 animate-pulse"
              style={{
                backgroundImage:
                  'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%234f46e5" stroke="%234f46e5" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>\')',
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                top: `${mousePosition.y / 2 + 150}px`,
                left: `${mousePosition.x / 2 - 100}px`,
                opacity: 0.3,
                transform: `scale(${
                  0.5 + (Math.sin(Date.now() / 1400) + 1) / 4
                })`,
                transition: "all 1.4s ease-out",
              }}
            />
          </>
        )}

        {/* Subtle route/path lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d={`M100,100 Q${150 + mousePosition.x / 20},${
              200 + mousePosition.y / 20
            } 300,150 T500,${200 + mousePosition.y / 30}`}
            stroke="url(#gradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="5,5"
            style={{ transition: "all 0.5s ease-out" }}
          />
          <path
            d={`M200,${300 + mousePosition.y / 40} Q${
              350 - mousePosition.x / 25
            },${250 - mousePosition.y / 25} 500,300`}
            stroke="url(#gradient)"
            strokeWidth="2"
            fill="none"
            style={{ transition: "all 0.7s ease-out" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative flex flex-col md:flex-row w-full max-w-5xl z-10 gap-8 px-4">
        <div className="w-full md:w-1/2 flex justify-center items-center group">
          <img
            src="tours.jpeg"
            alt="Tour"
            className="w-full h-auto max-w-sm md:max-w-full rounded-lg shadow-lg object-cover transition-all duration-500 group-hover:shadow-[0_15px_30px_rgba(66,71,200,0.2)] transform group-hover:scale-[1.02]"
          />
        </div>
        <div
          className="w-full md:w-1/2 flex flex-col justify-center p-8 bg-white rounded-lg border border-gray-100 transition-all duration-300"
          style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 15px 30px rgba(66, 71, 200, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.05)";
          }}>
          <h2 className="text-3xl font-bold mb-4 relative inline-block group">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-600 cursor-default transition-all duration-500">
              About Our Tours
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600/40 to-purple-500/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </h2>
          <p className="text-gray-600 mt-2 text-lg">
            We have been providing unforgettable travel experiences for years,
            ensuring every adventure is unique and filled with excitement.
          </p>
          <div className="mt-8 text-right">
            <span className="text-lg font-semibold text-gray-700 mr-2">
              Tours Completed:
            </span>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              <AnimatedCounter targetNumber={stats.tours} duration={3} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterSection;
