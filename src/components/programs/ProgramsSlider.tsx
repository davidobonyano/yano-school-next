'use client';

import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCompass,
  faLightbulb,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';

const slides = [
  {
    text: 'Moral Excellence',
    icon: <FontAwesomeIcon icon={faCompass} className="text-4xl text-red-400" />,
  },
  {
    text: 'Innovative Classrooms',
    icon: <FontAwesomeIcon icon={faLightbulb} className="text-4xl text-red-400" />,
  },
  {
    text: 'Caring Teachers',
    icon: <FontAwesomeIcon icon={faChalkboardTeacher} className="text-4xl text-red-400" />,
  },
];

export default function Programsslider() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (deltaX > swipeThreshold) {
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (deltaX < -swipeThreshold) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden h-[200px] md:h-[200px] bg-cover bg-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out h-full w-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full flex items-center justify-center flex-col space-y-4 px-4 text-center"
          >
            {slide.icon}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-700">{slide.text}</h2>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current ? 'bg-red-400' : 'bg-gray-400/50'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
