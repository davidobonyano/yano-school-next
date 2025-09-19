'use client';
import Link from 'next/link';
import SchoolHistory from '@/components/about/SchoolHistory';
import Mission from '@/components/mission/Mission';
import AchievementsTimeline from '@/components/about/AchievementsTimeline';
import LeadershipTeam from '@/components/about/LeadershipTeam';
import StudentGallery from '@/components/gallery/StudentGallery';
import Uniform from '@/components/about/Uniform';
import {  useEffect } from 'react';

export default function AboutPage() {
   useEffect(() => {
      window.scrollTo(0, 0);
    }, []);
    
  return (
    <main className='About'>
    
      <section id="history">
        <SchoolHistory />
      </section>

      <section id="mission-vision">
        <Mission />
      </section>

      <section id="timeline">
        <AchievementsTimeline />
      </section>

      <section id="leadership">
        <LeadershipTeam />
      </section>

      <section id="gallery">
        <StudentGallery />
      </section>

      <section id="uniform">
        <Uniform />
      </section>

      <div className="text-center flex flex-col items-center justify-center py-12">
        <p className="text-lg text-gray-700 ">Interested in Enrolling?</p>
        <Link
          href="/admissions"
          className="inline-block mt-4 border border-red-400 px-6 py-3 rounded-3xl text-black hover:bg-red-400 hover:text-white transition duration-300"
        >
          Visit Admissions Page →
        </Link>
      </div>
    
    </main>
   
  );
}
