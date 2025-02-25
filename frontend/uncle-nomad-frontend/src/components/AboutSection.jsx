import { Compass, Mountain, Users, User } from "lucide-react";

const cardData = [
  {
    title: "We are Uncle Nomad",
    description: "A travel community dedicated to making travel easy, accessible, and sustainable.",
    icon: Mountain,
  },
  {
    title: "Our Goal",
    description:
      "To provide authentic experiences while ensuring responsible travel practices that benefit both travelers and local communities.",
    icon: Compass,
  },
  {
    title: "Travel at Your Own Pace",
    imageSrc: "solo.jpg",
    icon: User,
  },
  {
    title: "Explore Together",
    imageSrc: "group.jpeg",
    icon: Users,
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-brand-purple text-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 text-center">About Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cardData.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
        <p className="text-center mt-10 text-white/80 max-w-2xl mx-auto text-lg">
          Whether you're a solo backpacker, a group traveler, or someone looking for a personalized trip, we help you
          explore the beautiful, unexplored parts of the world effortlessly.
        </p>
      </div>
    </section>
  );
}

function Card({ title, description, imageSrc, icon: Icon }) {
  return (
    <div className="bg-white/10 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:bg-white/20 hover:shadow-xl flex flex-col">
      {imageSrc ? (
        <div className="relative h-52 overflow-hidden">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4">
            <Icon className="h-10 w-10 mb-2 text-brand-yellow" />
            <h3 className="text-xl font-bold text-white text-center">{title}</h3>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center text-center flex-grow">
          <Icon className="h-12 w-12 mb-4 text-brand-yellow" />
          <h3 className="text-xl font-bold mb-3">{title}</h3>
          <p className="text-white/80 text-sm">{description}</p>
        </div>
      )}
    </div>
  );
}
