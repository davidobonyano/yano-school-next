'use client';

import { faBook, faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC } from 'react';

const Mission: FC = () => {
  return (
    <div className="py-16 mission px-4 sm:px-8 lg:px-16">
      <h2 className="relative text-3xl mt-4 font-bold text-center">Our Mission and Vision</h2>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-[2px] mt-2 bg-red-400 rounded-full" />
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-start gap-6 mt-6">
        {/* Mission Card */}
        <div className="relative mt-4 bg-white border-2 border-red-400 rounded-2xl p-6 max-w-md w-full transition transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_20px_-5px_rgba(30,58,138,0.5)]">
          <div className="absolute -top-8 left-6 w-16 h-16 border-2 border-red-400 bg-white rounded-2xl flex justify-center items-center">
            <FontAwesomeIcon icon={faBook} className="text-red-400 text-3xl" />
          </div>
          <h3 className="mt-10 font-bold text-xl">Our Mission</h3>
          <p className="mt-3 text-gray-700">
            At Yano School, our mission is to provide a dynamic and inclusive learning environment that fosters academic excellence, creativity, and personal growth.
          </p>
        </div>

        {/* Vision Card */}
        <div className="relative mt-4 bg-white border-2 border-red-400 rounded-2xl p-6 max-w-md w-full transition transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_20px_-5px_rgba(30,58,138,0.5)]">
          <div className="absolute -top-8 left-6 w-16 h-16 border-2 border-red-400 bg-white rounded-2xl flex justify-center items-center">
            <FontAwesomeIcon icon={faEye} className="text-red-400 text-3xl" />
          </div>
          <h3 className="mt-10 font-bold text-xl">Our Vision</h3>
          <p className="mt-3 text-gray-700">
            Our vision is to inspire learners to reach their full potential and become compassionate global citizens through a rich, engaging, and innovative education.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Mission;
