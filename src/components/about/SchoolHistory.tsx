'use client';

import { motion as Motion } from 'framer-motion';
import React from 'react';

// Props type for AnimatedText
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white relative inline-block">
            Our Journey
            <span className="block w-12 h-1 bg-red-500 mt-2 rounded-full" />
          </h2>
        </Motion.div>

        {/* Animated Paragraphs */}
        <div className="space-y-6 text-base sm:text-lg text-gray-900 dark:text-gray-200 leading-relaxed">
          <p>
            <AnimatedText text="Yano School opened its doors in January 2008, beginning with a single classroom and a powerful mission: to nurture young minds through excellence in education and character." />
          </p>
          <p>
            <AnimatedText text="As our reputation for quality education grew, so did our impact. By 2014, we launched a second branch — expanding our reach and giving more students access to a brighter future." />
          </p>
          <p>
            <AnimatedText text="From our humble beginning to our present-day growth, Yano School continues to be a home where students are empowered, talents are discovered, and futures are shaped. Together, we inspire the leaders of tomorrow." />
          </p>
        </div>
      </div>
    </section>
  );
}
