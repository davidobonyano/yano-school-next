'use client';

import { useEffect, useState } from 'react';
import { format, isAfter } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

type Event = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description?: string;
};

export default function AdmissionsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events?active=true&upcoming=true');
        const data = await res.json();
        const events = (data.events || []).slice(0, 3);
        setUpcomingEvents(events);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-12 space-y-20 text-gray-700">
      {/* Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden shadow-md h-[300px] md:h-[400px] lg:h-[500px]">
        <Image
          src="/images/admissions-bg.jpeg"
          alt="Admissions Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-start p-12 text-white">
          <div>
            <h1 className="text-4xl font-bold mb-4">Admissions</h1>
            <p className="max-w-2xl text-lg text-white/90">
              Give your child the best start in life. Yano School offers a nurturing environment,
              academic excellence, and personal growth opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">📌 How to Apply</h2>
        <ol className="list-decimal pl-6 space-y-3 text-gray-700">
          <li>Purchase and complete the application form.</li>
          <li>Submit required documents at the school office.</li>
          <li>Sit for the entrance examination.</li>
          <li>Attend an interview with the school administrator.</li>
          <li>Receive your admission letter if successful.</li>
        </ol>
      </section>

      {/* Requirements */}
      <section className="bg-gray-100 p-8 rounded-2xl">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">📝 Admission Requirements</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Completed application form</li>
          <li>Two recent passport photographs</li>
          <li>Copy of birth certificate</li>
          <li>Last term’s report card (for transfers)</li>
          <li>Medical report (if available)</li>
        </ul>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">📅 Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{event.title}</h3>
                <p className="text-gray-600 flex items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-red-400" />
                  {format(new Date(event.event_date), 'PPP')}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-400" />
                  {event.location}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No upcoming events at the moment.</p>
        )}
      </section>

      {/* CTA - Contact Admissions */}
      <section className="bg-white p-10 rounded-2xl text-center shadow">
        <p className="text-lg text-gray-700 mb-4">Have questions or need help with enrollment?</p>
        <Link
          href="/contact"
          className="inline-block bg-red-400 text-white font-medium px-6 py-3 rounded-full hover:bg-red-500 transition"
        >
          Contact the Admissions Office
        </Link>
      </section>
    </main>
  );
}
