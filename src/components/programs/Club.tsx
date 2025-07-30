'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLaptopCode,
  faUsers,
  faSun,
  faTheaterMasks,
  faMicrophone,
  faFutbol,
  faMusic,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons';

export default function Clubs() {
  const [showAll, setShowAll] = useState(false);

  const programs = [
    { icon: faLaptopCode, title: 'Coding Club', bg: '/images/code.avif' },
    { icon: faUsers, title: 'Leadership Academy', bg: '/images/leadership.avif' },
    { icon: faSun, title: 'Summer School', bg: '/images/summer.jpeg' },
  ];

  const activities = [
    { icon: faTheaterMasks, title: 'Drama & Performing Arts', bg: '/images/drama.jpeg' },
    { icon: faMicrophone, title: 'Debate & Public Speaking', bg: '/images/debate.jpeg' },
    { icon: faFutbol, title: 'Sports', bg: '/images/sport.jpeg' },
    { icon: faMusic, title: 'Music & Dance', bg: '/images/music.webp' },
    { icon: faNewspaper, title: 'School Press Club', bg: '/images/press.avif' },
  ];

  const combined = [...programs, ...activities];
  const visibleItems = showAll ? combined : combined.slice(0, 6);

  return (
    <section className="mb-16 px-4">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
        Special Programs & Co-Curricular Activities
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {visibleItems.map((item) => (
          <div
            key={item.title}
            className="relative h-52 rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer group"
          >
            <Image
              src={item.bg}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              style={{ zIndex: 1 }}
            />
            <div className="absolute inset-0 bg-black/40 z-10" />
            <div className="absolute bottom-4 left-4 text-white z-20">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={item.icon} className="text-red-400 text-xl" />
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Button (small screens) */}
      <div className="mt-6 flex justify-center md:hidden">
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-6 py-2 bg-red-400 text-white rounded-full text-sm hover:bg-red-500 transition"
        >
          {showAll ? 'Show Less' : 'Show All'}
        </button>
      </div>
    </section>
  );
}
