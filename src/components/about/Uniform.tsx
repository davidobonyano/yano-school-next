import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uniform Guidelines | Yano School",
  description: "Explore the official uniforms of Yano School and their dress code policy for boys, girls, sports, and Friday wear.",
};

const uniforms = [
  {
    src: "/images/uniforms/boys-regular.jpg",
    alt: "Boys Regular Uniform",
    title: "Boys Regular",
    description: "Pink top with striped pink and light purple trousers.",
    textColor: "text-blue-700",
  },
  {
    src: "/images/uniforms/girls-regular.jpg",
    alt: "Girls Regular Uniform",
    title: "Girls Regular",
    description: "Striped gown featuring pink and light purple tones.",
    textColor: "text-pink-700",
  },
  {
    src: "/images/uniforms/sports.jpg",
    alt: "Sportswear",
    title: "Sportswear",
    description: "Pink top and matching striped trousers. Worn during sports.",
    textColor: "text-green-700",
  },
  {
    src: "/images/uniforms/friday.jpg",
    alt: "Friday Wear",
    title: "Friday Polo",
    description: "Branded pink polo with striped trousers for all students.",
    textColor: "text-yellow-700",
  },
];

export default function UniformPage() {
  return (
    <section id="uniform" className="py-16 px-4 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">Uniform Guidelines</h2>
        <div className="ml-[10px] mb-4">
          <div className="w-16 h-[2px] mt-2 bg-red-400 rounded-full"></div>
        </div>
        <p className="text-gray-700 mb-8 max-w-2xl">
          Our students are expected to maintain a smart and modest appearance at all times.
          Below are the official uniforms for various school activities.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {uniforms.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <div className="relative w-full h-56">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  priority={index < 2}
                />
              </div>
              <div className="p-4">
                <h3 className={`text-xl font-semibold ${item.textColor}`}>{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-gray-700 text-sm italic">
          All students must wear white socks and black sandals. Grooming must be neat and appropriate.
        </p>
      </div>
    </section>
  );
}
