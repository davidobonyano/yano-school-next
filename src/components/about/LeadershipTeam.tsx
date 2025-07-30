'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  faUserTie,
  faChalkboardTeacher,
  faShieldAlt,
  faBroom,
  faUserGraduate,
  faQuoteLeft,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TeamMember = {
  name: string;
  role: string;
  icon: IconDefinition;
  photo: string;
  bio: string;
  funFact: string;
};

const team: TeamMember[] = [
  {
    name: 'Mr. Obonyano, AAT, ACA (ICAN)',
    role: 'Proprietor & Chairman',
    icon: faUserTie,
    photo: '/images/team/placeholders/teacher1.avif',
    bio: 'A seasoned accounting professional overseeing school governance and strategic direction.',
    funFact: 'Enjoys reading thought-provoking books.',
  },
  {
    name: 'Mr. Oboh',
    role: 'Headmaster – Ketu Campus',
    icon: faChalkboardTeacher,
    photo: '/images/team/placeholders/teacher2.avif',
    bio: 'Experienced in academic leadership with a passion for student discipline and growth.',
    funFact: 'Plays chess competitively.',
  },
  {
    name: 'Mrs. Soetan',
    role: 'Headmistress – Ikorodu Campus',
    icon: faChalkboardTeacher,
    photo: '/images/team/placeholders/teacher3.webp',
    bio: 'Dedicated to fostering a nurturing academic environment with high standards.',
    funFact: 'Loves gardening on weekends.',
  },
  {
    name: 'Mr. Adeyemi',
    role: 'Senior Teacher (Math & ICT)',
    icon: faUserGraduate,
    photo: '/images/team/placeholders/teacher4.avif',
    bio: 'Manages class schedules, results, and teaches core STEM subjects.',
    funFact: 'Loves coding and jazz.',
  },
  {
    name: 'Mrs. Chukwu',
    role: 'English Teacher & Admissions',
    icon: faUserGraduate,
    photo: '/images/team/placeholders/teacher3.webp',
    bio: 'Handles school admissions and excels at literature and essay coaching.',
    funFact: 'Writes poetry in her spare time.',
  },
  {
    name: 'Mr. Lawal',
    role: 'Security Officer',
    icon: faShieldAlt,
    photo: '/images/team/placeholders/teacher5.avif',
    bio: 'Responsible for maintaining a safe and secure school environment.',
    funFact: 'Former amateur boxer.',
  },
  {
    name: 'Mrs. Fatima',
    role: 'Facility Staff',
    icon: faBroom,
    photo: '/images/team/placeholders/teacher6.webp',
    bio: 'Ensures our environment is clean, welcoming, and sanitized daily.',
    funFact: 'Enjoys painting landscapes.',
  },
];

export default function LeadershipTeam() {
  return (
    <section className="py-16 px-4 bg-gray-100 dark:bg-gray-900">
      <h2 className="text-center text-3xl font-bold text-gray-700 dark:text-white mb-12">
        Leadership & Team
      </h2>

      <div className="max-w-6xl mx-auto grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {team.map((member, index) => (
          <TeamCard key={index} {...member} />
        ))}
      </div>
    </section>
  );
}
function TeamCard({
  name,
  role,
  icon,
  photo,
  bio,
  funFact,
}: TeamMember) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition duration-300 overflow-hidden">
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
        <FontAwesomeIcon icon={icon} className="text-red-400 text-xl mb-2" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-white">{name}</h3>
        <p className="italic text-sm text-gray-600 dark:text-gray-400 mb-2">{role}</p>

        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-red-500 hover:underline focus:outline-none mb-2"
        >
          {open ? 'Hide Bio ▲' : 'Read Bio ▼'}
        </button>

        {open && (
          <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded p-3 mt-2">
            <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 text-red-300" />
            <p>{bio}</p>
            <p className="mt-2 text-xs italic">Fun fact: {funFact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
