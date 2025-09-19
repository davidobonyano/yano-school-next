'use client';

import Link from 'next/link';
import Mission from "@/components/mission/Mission";
import Aboutlayout from "@/components/about/AboutLayout";
import EventsHome from "@/components/events/EventsHome";
import Programsslider from "@/components/programs/ProgramsSlider";
import Programslayout from "@/components/programs/ProgramsLayout";
import UniformPreview from "@/components/uniform/UniformPreview";
import Testimonialslider from "@/components/testimonials/TestimonialSlider";
import { useEffect } from 'react';

export default function Home() {
   useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
  return (
    <main className="Home">
      {/* Hero Section */}
      <section
        className="relative w-full h-screen overflow-hidden"
        style={{
          backgroundImage: `url('/images/hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] md:backdrop-blur-[2px] z-10"></div>

        {/* Content over background */}
        <div className="relative z-20 flex flex-col justify-center h-full text-white px-6 max-w-2xl pt-[140px] landscape:pt-[150px] sm:pt-[120px]">
          <p className="text-red-400 uppercase tracking-widest font-bold text-sm">
            Choose The Best
          </p>
          <h1 className="text-3xl md:text-3xl font-bold leading-tight">
            Education For Your Future
          </h1>
          <p className="mt-2 text-gray-200 font-light text-lg md:text-xl">
            At Yano School, we help every student discover their path in both academics and life.
          </p>
          <div className="mt-6">
            <Link
              href="/admissions"
              className="bg-blue-900 hover:bg-blue-800 rounded-3xl px-6 py-3 text-white inline-block"
            >
              Enroll today <span className="inline-block ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Other Home Page Sections */}
      <section className="pt-12">
        <Mission />
      </section>
      <section>
        <Aboutlayout />
      </section>
      <section>
        <EventsHome />
      </section>
      <section>
        <Programsslider />
        <Programslayout />
      </section>
      <section>
        <UniformPreview />
      </section>
      <section>
        <Testimonialslider />
      </section>
    </main>
  );
}
