
'use client';

import { motion as Motion } from 'framer-motion';

const achievements = [
  {
    date: 'Jan 2008',
    title: 'School Founded',
    description: 'Yano School was established with a mission to raise excellent leaders through education.',
  },
  {
    date: 'Jul 2010',
    title: 'Macmillan English Contest Debut',
    description: 'Participated in our first Macmillan English competition at the district level.',
  },
  {
    date: 'Jun 2012',
    title: 'Cowbellpedia Qualifiers',
    description: 'Reached local district finals of Cowbellpedia Mathematics Competition.',
  },
  {
    date: 'May 2016',
    title: 'Macmillan English Contest',
    description: 'Advanced to state-level finals, placing among the top 15 schools.',
  },
  {
    date: 'Jun 2018',
    title: 'Cowbellpedia District Achievement',
    description: 'Came 13th at the district-level Cowbellpedia competition.',
  },
  {
    date: 'Jun 2022',
    title: 'SEA‑Hub Entrepreneurship Competition',
    description: 'Alimosho Senior Grammar School won at the Lagos state entrepreneurship challenge.',
  },
  {
    date: 'Jul 2024',
    title: 'Tolaram Science Challenge Winner (Secondary)',
    description: 'Won the Lagos edition of the prestigious Tolaram Science Challenge.',
  },
  {
    date: 'Jul 2024',
    title: 'The Consider Aromi Winners',
    description: 'Yano students claimed top positions in both junior and senior categories.',
  },
  {
    date: 'Oct 2024',
    title: 'Lagos Governor’s Quiz Competition',
    description: 'Secured 14th place among over 100 participating schools across Lagos.',
  },
  {
    date: 'Mar 2025',
    title: 'The Athletics School Games (TASG)',
    description: 'Excelled in the Lagos-wide athletics games, securing medals in relay and long jump.',
  },
];

export default function AchievementsTimeline() {
  return (
    <section className="bg-gray-100 py-16 px-6 sm:px-10">
      <div className="max-w-5xl mx-auto">
        <Motion.h2
          className="text-3xl font-bold text-gray-700 inline-block mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Our Achievements
          <span className="block w-16 h-1 bg-red-500 mt-2 rounded-full" />
        </Motion.h2>

        <div className="relative border-l-2 border-red-200 ml-4">
          {achievements.map((item, idx) => (
            <Motion.div
              key={idx}
              className="mb-10 pl-6 relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <span className="absolute -left-4 top-1 w-3 h-3 bg-red-500 rounded-full" />
              <time className="text-sm font-medium text-gray-600">{item.date}</time>
              <h3 className="text-lg font-semibold text-gray-600 mt-1">{item.title}</h3>
              <p className="text-gray-700 mt-1 text-[15px] leading-snug">{item.description}</p>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
