
'use client';

import { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';

type Achievement = {
  id: string;
  event_date: string;
  title: string;
  description: string;
};

export default function AchievementsTimeline() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fallback: Achievement[] = [
    { id: 'f1', event_date: '2008-01-01', title: 'School Founded', description: 'Yano School was established with a mission to raise excellent leaders through education.' },
    { id: 'f2', event_date: '2010-07-01', title: 'Macmillan English Contest Debut', description: 'Participated in our first Macmillan English competition at the district level.' },
    { id: 'f3', event_date: '2012-06-01', title: 'Cowbellpedia Qualifiers', description: 'Reached local district finals of Cowbellpedia Mathematics Competition.' },
    { id: 'f4', event_date: '2016-05-01', title: 'Macmillan English Contest', description: 'Advanced to state-level finals, placing among the top 15 schools.' },
    { id: 'f5', event_date: '2018-06-01', title: 'Cowbellpedia District Achievement', description: 'Came 13th at the district-level Cowbellpedia competition.' },
    { id: 'f6', event_date: '2022-06-01', title: 'SEA‑Hub Entrepreneurship Competition', description: 'Alimosho Senior Grammar School won at the Lagos state entrepreneurship challenge.' },
    { id: 'f7', event_date: '2024-07-01', title: 'Tolaram Science Challenge Winner (Secondary)', description: 'Won the Lagos edition of the prestigious Tolaram Science Challenge.' },
    { id: 'f8', event_date: '2024-07-01', title: 'The Consider Aromi Winners', description: 'Yano students claimed top positions in both junior and senior categories.' },
    { id: 'f9', event_date: '2024-10-01', title: 'Lagos Governor’s Quiz Competition', description: 'Secured 14th place among over 100 participating schools across Lagos.' },
    { id: 'f10', event_date: '2025-03-01', title: 'The Athletics School Games (TASG)', description: 'Excelled in the Lagos-wide athletics games, securing medals in relay and long jump.' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/achievements');
        const data = await res.json();
        const incoming = (data.achievements || []) as Achievement[];
        setItems(incoming.length ? incoming : fallback);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

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

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
          <div className="relative border-l-2 border-red-200 ml-4">
            {items.map((item, idx) => (
              <Motion.div
                key={item.id}
                className="mb-10 pl-6 relative"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <span className="absolute -left-4 top-1 w-3 h-3 bg-red-500 rounded-full" />
                <time className="text-sm font-medium text-gray-600">
                  {new Date(item.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </time>
                <h3 className="text-lg font-semibold text-gray-600 mt-1">{item.title}</h3>
                <p className="text-gray-700 mt-1 text-[15px] leading-snug">{item.description}</p>
              </Motion.div>
            ))}
            {items.length === 0 && (
              <div className="text-gray-600">No achievements yet.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
