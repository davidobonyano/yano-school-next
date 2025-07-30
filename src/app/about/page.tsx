// src/app/about/page.tsx
import Link from 'next/link';
import SchoolHistory from '@/components/about/SchoolHistory';
import Mission from '@/components/mission/Mission';
import AchievementsTimeline from '@/components/about/AchievementsTimeline';
import LeadershipTeam from '@/components/about/LeadershipTeam';
import Uniform from '@/components/about/Uniform';

export default function AboutPage() {
  return (
    <div className="About">
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

      <section>
        <Uniform />
      </section>

      <div className="text-center flex flex-col items-center justify-center py-12">
        <p className="text-lg text-gray-700 dark:text-gray-200">Interested in Enrolling?</p>
        <Link
          href="/admissions"
          className="inline-block mt-4 border border-red-400 px-6 py-3 rounded-3xl text-black dark:text-white hover:bg-red-400 hover:text-white transition duration-300"
        >
          Visit Admissions Page →
        </Link>
      </div>
    </div>
  );
}
