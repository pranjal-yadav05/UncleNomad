import { Compass, Mountain, Users, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const cardData = [
  {
    title: "We are Uncle Nomad",
    description: "A travel community dedicated to making travel easy, accessible, and sustainable.",
    imageSrc: 'nomad.jpeg',
    icon: Mountain,
  },
  {
    title: "Our Goal",
    description:
      "To provide authentic experiences while ensuring responsible travel practices that benefit both travelers and local communities.",
    imageSrc: 'goal.jpeg',
    icon: Compass,
  },
  {
    title: "Travel at Your Own Pace",
    description: "Discover hidden gems and enjoy your journey at your own speed.",
    imageSrc: "solo.jpeg",
    icon: User,
  },
  {
    title: "Explore Together",
    description: "Join like-minded travelers and create unforgettable memories.",
    imageSrc: "group.jpeg",
    icon: Users,
  },
];

export default function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);

  // Automatic animation every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % cardData.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll to the active card and center it on small screens
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const activeCard = container.children[activeIndex];

      if (activeCard) {
        const containerWidth = container.offsetWidth;
        const cardWidth = activeCard.offsetWidth;
        const scrollLeft = activeCard.offsetLeft - (containerWidth - cardWidth) / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex]);

  return (
    <section id="about" className="bg-brand-purple bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-extrabold mb-12 text-center">About Us</h2>

        {/* Scrollable Row on Small Screens, Grid on Large Screens */}
        <div className="relative py-8">
          <div
            ref={carouselRef}
            className="flex lg:grid lg:grid-cols-4 gap-6 overflow-x-auto scroll-smooth snap-x scrollbar-hide pb-8 px-2 sm:justify-start lg:place-items-center"
          >
            {cardData.map((card, index) => (
              <Card key={index} {...card} isActive={index === activeIndex} />
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-center mt-6 text-white/80 max-w-2xl mx-auto text-lg px-4">
          Whether you're a solo backpacker, a group traveler, or someone looking for a personalized trip, we help you
          explore the beautiful, unexplored parts of the world effortlessly.
        </p>
      </div>
    </section>
  );
}

function Card({ title, description, imageSrc, icon: Icon, isActive }) {
  return (
    <div
      className={`bg-white/10 rounded-xl shadow-lg transition-all duration-1000 transform flex flex-col 
      ${isActive ? "opacity-100 scale-110 z-10" : "opacity-70 scale-95 z-0"} flex-shrink-0 w-[300px] h-[380px] snap-start`}
      style={{
        transition: "transform 0.8s ease-in-out, opacity 0.8s ease-in-out",
        boxShadow: isActive ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 10px 20px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Image with Overlay */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4">
          <Icon className="h-10 w-10 mb-2 text-yellow-400" />
          <h3 className="text-xl font-bold text-white text-center">{title}</h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex items-center">
        <p className="text-white/80 text-sm text-center w-full">{description}</p>
      </div>
    </div>
  );
}