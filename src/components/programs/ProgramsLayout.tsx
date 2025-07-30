'use client';

import { faBookOpen, faSchool, faLeaf } from '@fortawesome/free-solid-svg-icons';
import FeatureCard from '../FeatureCard';
const features = [
  {
    title: 'Our Programs',
    icon: faBookOpen,
    description:
      'We offer a rich blend of academic and extracurricular programs tailored to every child’s development.',
    image: '/images/why-us/programs.avif',
  },
  {
    title: 'Modern Facilities',
    icon: faSchool,
    description:
      'Equipped with ICT labs, libraries, playgrounds, and secure learning spaces for every student.',
    image: '/images/why-us/facilities.webp',
  },
  {
    title: 'Conducive Learning',
    icon: faLeaf,
    description:
      'A calm and encouraging atmosphere that promotes focus, creativity, and growth.',
    image: '/images/why-us/conducive.webp',
  },
];

const Programslayout = () => {
  return (
    <section className="py-12 bg-gray-100 duration-300">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-700">Why Choose Yano School?</h2>
        <p className="text-gray-700 mt-2">We provide everything your child needs to thrive.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {features.map((item, index) => (
          <FeatureCard
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            image={item.image}
          />
        ))}
      </div>
    </section>
  );
};

export default Programslayout;
