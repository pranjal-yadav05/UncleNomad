import { Compass, Mountain, PersonStanding } from "lucide-react"

export default function AboutSection() {
  return (
    <section id="about" className="bg-brand-purple text-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">The Uncle Nomad Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Handpicked Properties",
              description: "Carefully selected stays in prime locations",
              icon: Mountain,
            },
            {
              title: "Expert Local Guides",
              description: "Experienced guides who know every trail",
              icon: PersonStanding,
            },
            {
              title: "Curated Experiences",
              description: "Unique adventures and cultural experiences",
              icon: Compass,
            },
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                <feature.icon className="h-8 w-8 text-brand-purple" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

