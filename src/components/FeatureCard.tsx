'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FeatureCardProps = {
  icon: IconDefinition;
  title: string;
  description: string;
  image: string;
};

const FeatureCard = ({ icon, title, description, image }: FeatureCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const [showOverlay, setShowOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardClick = () => {
    if (!isMobile) {
      router.push('/programs');
    } else {
      setShowOverlay(!showOverlay);
    }
  };

  return (
    <div
      ref={ref}
      onClick={handleCardClick}
      className={`group relative cursor-pointer transition-opacity duration-700 ease-out ${
        inView ? 'opacity-100' : 'opacity-0'
      } bg-gray-100 text-gray-700 rounded-2xl shadow-lg overflow-hidden`}
    >
      {/* Background image */}
      <div className="relative w-full h-48">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Gradient overlay + button */}
      <div
        className={`absolute top-0 left-0 w-full h-48 
          bg-gradient-to-t from-blue-900/70 via-blue-800/60 to-transparent 
          flex items-center justify-center transition-opacity duration-300
          ${showOverlay ? 'opacity-100' : 'opacity-0'} 
          md:opacity-0 md:group-hover:opacity-100`}
      >
        <Link href="/programs" className="bg-white text-blue-900 px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:bg-blue-100 transition">
          Explore Programs
        </Link>
      </div>

      {/* Text content */}
      <div className="p-6 text-center">
        <FontAwesomeIcon icon={icon} className="text-red-400 text-3xl mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
