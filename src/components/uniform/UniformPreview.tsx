import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shirt } from "lucide-react";

const uniformPreview = [
  {
    src: "/images/uniforms/boys-regular.jpg",
    alt: "Boys Regular Uniform",
    title: "Boys Regular",
    description: "Pink top with striped trousers",
  },
  {
    src: "/images/uniforms/girls-regular.jpg", 
    alt: "Girls Regular Uniform",
    title: "Girls Regular",
    description: "Striped gown with pink tones",
  },
  {
    src: "/images/uniforms/sports.jpg",
    alt: "Sportswear",
    title: "Sportswear", 
    description: "Pink sports attire for PE",
  },
];

export default function UniformPreview() {
  return (
    <section className="py-16 px-4 bg-red-50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shirt className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-gray-900">School Uniforms</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Smart, modest, and comfortable uniforms that reflect our school's values and identity.
          </p>
        </div>

        {/* Uniform Preview Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {uniformPreview.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative w-full h-48">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg p-6 shadow-md inline-block">
            <p className="text-gray-600 mb-4">
              <strong className="text-gray-900">Dress Code:</strong> White socks, black sandals, neat grooming required
            </p>
            <Link 
              href="/about#uniform"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors duration-300 font-medium"
            >
              View Full Guidelines
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
