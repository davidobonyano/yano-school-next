'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteRight } from '@fortawesome/free-solid-svg-icons';

type Slide = {
  id: string;
  name: string;
  title: string;
  message: string;
  image_url?: string;
};

export default function TestimonialSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setHasMounted(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/testimonials');
        const data = await res.json();
        const incoming = (data.testimonials || []) as Slide[];
        if (incoming.length) setSlides(incoming);
        else setSlides([
          { id: 't1', name: 'David Efe', title: 'Geologist & Programmer', message: 'Na Yano School make me sabi book well-well. Now I dey code and crack rock!', image_url: '/images/students/dyano.jpg' },
          { id: 't2', name: 'John Peace', title: 'Accountant (ACA, ICAN)', message: 'Yano School gave me a strong foundation to pursue the highest professional qualifications in Nigeria.', image_url: '/images/students/peace.avif' },
          { id: 't3', name: 'Fatima Abdul', title: 'Surgical Intern (Doctor sha.)', message: 'Yano School prepared me for life... but them no prepare me for how fast phone battery dey finish in medical school!', image_url: '/images/students/fatima.webp' },
        ]);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (deltaX > threshold) {
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (deltaX < -threshold) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden py-12"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h2 className="text-3xl font-bold text-center">What Our Students Say</h2>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-[2px] mt-2 bg-red-400 rounded-full"></div>
      </div>

      <div
        className={`flex ${
          hasMounted ? 'transition-transform duration-700 ease-in-out' : ''
        }`}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full flex flex-col items-center justify-center px-6 text-center"
          >
            <Image
              src={slide.image_url || '/images/students/placeholder.jpg'}
              alt={slide.name}
              width={112}
              height={112}
              className="rounded-full mb-4 object-cover w-28 h-28"
            />
            <p className="text-lg text-gray-700 max-w-xl italic relative">
              “{slide.message}”
              <FontAwesomeIcon
                icon={faQuoteRight}
                className="text-red-400 text-2xl absolute -bottom-6 right-2"
              />
            </p>
            <p className="mt-6 font-semibold text-gray-700">{slide.name}</p>
            <p className="text-sm text-gray-500">{slide.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
