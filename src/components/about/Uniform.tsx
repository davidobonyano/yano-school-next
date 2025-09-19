import Image from "next/image";
import type { Metadata } from "next";
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "Uniform Guidelines | Yano School",
  description: "Explore the official uniforms of Yano School and their dress code policy for boys, girls, sports, and Friday wear.",
};

type Uniform = {
  id: string;
  image_url: string;
  alt?: string;
  title: string;
  description?: string;
  text_color?: string;
};

export default function UniformPage() {
  const [items, setItems] = useState<Uniform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/uniforms');
        const data = await res.json();
        const incoming = (data.uniforms || []) as Uniform[];
        if (incoming.length) {
          setItems(incoming);
        } else {
          setItems([
            { id: 'u1', image_url: '/images/uniforms/boys-regular.jpg', alt: 'Boys Regular Uniform', title: 'Boys Regular', description: 'Pink top with striped pink and light purple trousers.', text_color: 'text-blue-700' },
            { id: 'u2', image_url: '/images/uniforms/girls-regular.jpg', alt: 'Girls Regular Uniform', title: 'Girls Regular', description: 'Striped gown featuring pink and light purple tones.', text_color: 'text-pink-700' },
            { id: 'u3', image_url: '/images/uniforms/sports.jpg', alt: 'Sportswear', title: 'Sportswear', description: 'Pink top and matching striped trousers. Worn during sports.', text_color: 'text-green-700' }
          ]);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);
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

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <div className="relative w-full h-56">
                <Image
                  src={item.image_url}
                  alt={item.alt || item.title}
                  fill
                  className="object-cover"
                  priority={index < 2}
                />
              </div>
              <div className="p-4">
                <h3 className={`text-xl font-semibold ${item.text_color || 'text-gray-800'}`}>{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        )}

        <p className="mt-10 text-gray-700 text-sm italic">
          All students must wear white socks and black sandals. Grooming must be neat and appropriate.
        </p>
      </div>
    </section>
  );
}
