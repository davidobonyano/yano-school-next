'use client';

import { motion as Motion } from 'framer-motion';



interface AnimatedTextProps {
  text: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text }) => {
  const words = text.split(' ');

  return (
    <span className="inline-block">
      {words.map((word, index) => (
        <Motion.span
          key={index}
          className="inline-block mr-1"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.03,
          }}
          viewport={{ once: true }}
        >
          {word}
        </Motion.span>
      ))}
    </span>
  );
};

export default function SchoolHistory() {
  return (
    <section className="bg-gradient-to-br backdrop-blur from-blue-50 via-white to-red-50 py-20 px-6 sm:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <Motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
         <h2 className="text-3xl font-bold text-gray-900 relative inline-block">
            Our Journey
              <span className="block w-12 h-1 bg-red-500 mt-2 rounded-full" />
          </h2>
        </Motion.div>

        {/* Animated Paragraphs */}
        <div className="space-y-6 text-base sm:text-lg text-gray-900 leading-relaxed">
          <p>
            <AnimatedText text="Yano School opened its doors in January 2008, founded by Mr. Obonyano. What began with a single classroom and a clear vision has grown into a thriving community dedicated to excellence in education and character." />
          </p>
          <p>
            <AnimatedText text="As our reputation for quality education grew, so did our impact. By 2014, we launched a second branch — expanding our reach and giving more students access to a brighter future." />
          </p>
          <p>
            <AnimatedText text="From our humble beginning to our present-day growth, Yano School continues to be a home where students are empowered, talents are discovered, and futures are shaped. Our aim is to make quality private education accessible to all families — through supportive options and scholarships — while investing in excellent teachers, well-equipped classrooms, and modern learning resources so every child can thrive. Together, we inspire the leaders of tomorrow." />
          </p>
        </div>
      </div>
    </section>
  );
}
