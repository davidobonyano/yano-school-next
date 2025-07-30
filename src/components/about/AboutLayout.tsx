'use client';

import Link from 'next/link';

function AboutLayout() {
  return (
    <div className="Aboutlayout py-16 bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-center text-gray-700">About Yano School</h1>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-[2px] mt-2 bg-red-400 rounded-full"></div>
      </div>
      <p>
        Yano school has been paving the way as a leading <span className="font-bold text-red-400">institution</span> in innovative education, boasting multiple branches across Lagos State. Our goal is to <span className="font-bold text-red-400">provide hope</span> through education and to <span className="font-bold text-red-400">instill strong character values</span> that will guide our students well into the future.
      </p>

      <Link
        href="/about" 
        className="flex transition duration-300 items-center text-black w-fit justify-center border mt-4 border-red-400 hover:border-0 rounded-3xl px-6 py-3"
      >
        Learn More About Us <div className="inline-block ml-2">→</div>
      </Link>
    </div>
  );
}

export default AboutLayout;
