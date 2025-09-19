'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TeamMember = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  funFact: string;
};

export default function LeadershipTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        const normalized: TeamMember[] = (data.team && data.team.length ? data.team : [
          { name: 'Mr. Obonyano, AAT, ACA (ICAN)', role: 'Proprietor & Chairman', photo: '/images/team/placeholders/teacher1.avif', bio: 'A seasoned accounting professional overseeing school governance and strategic direction.', funFact: 'Enjoys reading thought-provoking books.' },
          { name: 'Mr. Oboh', role: 'Headmaster – Ketu Campus', photo: '/images/team/placeholders/teacher2.avif', bio: 'Experienced in academic leadership with a passion for student discipline and growth.', funFact: 'Plays chess competitively.' },
          { name: 'Mrs. Soetan', role: 'Headmistress – Ikorodu Campus', photo: '/images/team/placeholders/teacher3.webp', bio: 'Dedicated to fostering a nurturing academic environment with high standards.', funFact: 'Loves gardening on weekends.' },
        ]).map((t: any) => ({
          name: t.name,
          role: t.role,
          photo: t.photo_url || '/images/team/placeholders/teacher1.avif',
          bio: t.bio || '',
          funFact: t.fun_fact || '',
        }));
        setTeam(normalized);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);
  return (
    <section className="py-16 px-4 bg-gray-100">
      <h2 className="text-center text-3xl font-bold text-gray-700 mb-12">
        Leadership & Team
      </h2>

      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : (
        <div className="max-w-6xl mx-auto grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {team.map((member, index) => (
            <TeamCard key={index} {...member} />
          ))}
          {team.length === 0 && (
            <div className="text-center text-gray-600 col-span-full">No team members yet.</div>
          )}
        </div>
      )}
    </section>
  );
}
function TeamCard({
  name,
  role,
  photo,
  bio,
  funFact,
}: TeamMember) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition duration-300 overflow-hidden">
      <div className="w-full h-64 relative">
        <Image
          src={photo}
          alt={name}
          fill
          className="object-cover rounded-t-2xl"
          loading="lazy"
        />
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        <h3 className="text-lg font-semibold text-gray-700">{name}</h3>
        <p className="italic text-sm text-gray-600 mb-2">{role}</p>

        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-red-500 hover:underline focus:outline-none mb-2"
        >
          {open ? 'Hide Bio ▲' : 'Read Bio ▼'}
        </button>

        {open && (
          <div className="text-sm text-gray-700 bg-gray-100 rounded p-3 mt-2">
            <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 text-red-300" />
            <p>{bio}</p>
            <p className="mt-2 text-xs italic">Fun fact: {funFact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
