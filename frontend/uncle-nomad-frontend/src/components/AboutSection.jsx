import { Compass, Mountain, Users, User } from "lucide-react";
import { useRef } from "react";

const cardData = [
  {
    title: "We are Uncle Nomad",
    description:
      "A travel community dedicated to making travel easy, accessible, and sustainable.",
    imageSrc: "nomad.jpeg",
    icon: Mountain,
  },
  {
    title: "Our Goal",
    description:
      "To provide authentic experiences while ensuring responsible travel practices that benefit both travelers and local communities.",
    imageSrc: "goal.jpeg",
    icon: Compass,
  },
  {
    title: "Travel at Your Own Pace",
    description:
      "Discover hidden gems and enjoy your journey at your own speed.",
    imageSrc: "solo.jpeg",
    icon: User,
  },
  {
    title: "Explore Together",
    description:
      "Join like-minded travelers and create unforgettable memories.",
    imageSrc: "group.jpeg",
    icon: Users,
  },
];

export default function AboutSection() {
  const carouselRef = useRef(null);

  return (
    <section
      id="about"
      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-center" style={{fontFamily: "Josefin Sans"}}>About Us</h2>

        {/* Scrollable Row for Small Screens, Grid for Large Screens */}
        <div
          ref={carouselRef}
          className="flex lg:grid lg:grid-cols-4 gap-6 overflow-x-auto scroll-smooth snap-x scrollbar-hide pb-8 px-2">
          {cardData.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>

        {/* Description */}
        <p className="text-center mt-6 text-white/80 max-w-2xl mx-auto text-xl px-4">
          Whether you're a solo backpacker, a group traveler, or someone looking
          for a personalized trip, we help you explore the beautiful, unexplored
          parts of the world effortlessly.
        </p>
      </div>
    </section>
  );
}

function Card({ title, description, imageSrc, icon: Icon }) {
  return (
    <div
      className="bg-white/10 rounded-xl shadow-lg transition-transform duration-300 hover:scale-110 hover:z-10 flex flex-col flex-shrink-0 w-[300px] h-[380px] snap-start"
      style={{
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
      }}>
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
        <p className="text-white/80 text-base text-center w-full">
          {description}
        </p>
      </div>
    </div>
  );
}
