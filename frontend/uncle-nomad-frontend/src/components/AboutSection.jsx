import { Compass, Mountain, Users, User } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const cardData = [
  {
    title: "We are Uncle Nomad",
    description:
      "A travel community dedicated to making travel easy, accessible, and sustainable.",
    imageSrc: "nomad.jpeg",
    icon: Mountain,
    color: "from-indigo-500 to-blue-500",
    hoverColor: "from-blue-500 to-indigo-500",
  },
  {
    title: "Our Goal",
    description:
      "To provide authentic experiences while ensuring responsible travel practices that benefit both travelers and local communities.",
    imageSrc: "goal.jpeg",
    icon: Compass,
    color: "from-purple-500 to-indigo-500",
    hoverColor: "from-indigo-500 to-purple-500",
  },
  {
    title: "Travel at Your Own Pace",
    description:
      "Discover hidden gems and enjoy your journey at your own speed.",
    imageSrc: "solo.jpeg",
    icon: User,
    color: "from-blue-500 to-cyan-500",
    hoverColor: "from-cyan-500 to-blue-500",
  },
  {
    title: "Explore Together",
    description:
      "Join like-minded travelers and create unforgettable memories.",
    imageSrc: "group.jpeg",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    hoverColor: "from-pink-500 to-purple-500",
  },
];

export default function AboutSection() {
  const carouselRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // For mobile devices, show effects on tap
  const handleCardTouch = (index) => {
    if (isMobile) {
      setHoveredIndex(hoveredIndex === index ? null : index);
    }
  };

  return (
    <section
      id="about"
      className="bg-white text-gray-800 py-24 md:py-32 min-h-screen flex flex-col justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-100 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-100 opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        <div
          className="mb-16 text-center group relative"
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          onTouchStart={() => setIsTitleHovered(!isTitleHovered)}
          onTouchEnd={(e) => e.preventDefault()}>
          <h2
            className="text-4xl md:text-5xl font-extrabold inline-block"
            style={{ fontFamily: "Josefin Sans" }}>
            <span
              className={`bg-clip-text text-transparent bg-gradient-to-r ${
                isTitleHovered
                  ? "from-purple-500 to-indigo-600"
                  : "from-indigo-600 to-purple-500"
              } transition-all duration-500`}>
              About Us
            </span>
          </h2>
          <span
            className={`block h-1 bg-gradient-to-r from-indigo-600/40 to-purple-500/40 mt-2 mx-auto w-32 transform ${
              isTitleHovered ? "scale-x-100" : "scale-x-0"
            } transition-transform duration-300 origin-center`}></span>
        </div>

        {/* Scrollable Row for Small Screens, Grid for Large Screens */}
        <div
          ref={carouselRef}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 overflow-x-auto md:overflow-x-visible scroll-smooth snap-x scrollbar-hide pb-8 px-2 w-full">
          {cardData.map((card, index) => (
            <Card
              key={index}
              {...card}
              isHovered={hoveredIndex === index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => handleCardTouch(index)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Description */}
        <div
          className="mt-10 text-center max-w-2xl mx-auto px-4 relative"
          onMouseEnter={() => setIsDescriptionHovered(true)}
          onMouseLeave={() => setIsDescriptionHovered(false)}
          onTouchStart={() => setIsDescriptionHovered(!isDescriptionHovered)}
          onTouchEnd={(e) => e.preventDefault()}>
          <p className="text-gray-600 text-xl">
            Whether you're a solo backpacker, a group traveler, or someone
            looking for a personalized trip, we help you explore the beautiful,
            unexplored parts of the world effortlessly.
          </p>
          <span
            className={`absolute -bottom-2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent transform ${
              isDescriptionHovered ? "scale-x-100" : "scale-x-0"
            } transition-transform duration-500 origin-center`}></span>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  description,
  imageSrc,
  icon: Icon,
  color,
  hoverColor,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  isMobile,
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 transition-all duration-500 hover:scale-105 hover:z-10 w-[300px] md:w-full md:max-w-[300px] h-[380px] snap-start flex-shrink-0 md:flex-shrink mx-auto group"
      style={{
        boxShadow: isHovered
          ? "0 20px 25px rgba(79, 70, 229, 0.15)"
          : "0 4px 15px rgba(0, 0, 0, 0.1)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
      }}
      onMouseEnter={!isMobile ? onMouseEnter : undefined}
      onMouseLeave={!isMobile ? onMouseLeave : undefined}
      onTouchStart={onTouchStart}>
      {/* Image with Overlay */}
      <div className="relative h-56 overflow-hidden rounded-t-xl">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isHovered ? hoverColor : color
          } opacity-80 transition-all duration-500`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4 transition-opacity duration-300">
            <div className="relative">
              <Icon
                className={`h-10 w-10 mb-2 text-white transition-transform duration-500 ${
                  isHovered ? "scale-125" : "scale-100"
                }`}
              />
              {isHovered && (
                <div className="absolute inset-0 animate-ping opacity-70 rounded-full bg-white/30"></div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white text-center transition-all duration-300 group-hover:tracking-wider">
              {title}
            </h3>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex items-center relative overflow-hidden">
        <p className="text-gray-600 text-base text-center w-full transition-transform duration-500 group-hover:transform-none">
          {description}
        </p>
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
