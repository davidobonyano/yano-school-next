'use client';

import { useEffect, useState } from 'react';
import { format, isAfter, isBefore } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

type Event = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description?: string;
};

export default function EventsHome() {
  const [events, setEvents] = useState<Event[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events?active=true');
        const data = await res.json();
        const rawEvents: Event[] = data.events || [];
        const today = new Date();

        const upcoming = rawEvents
          .filter(e => isAfter(new Date(e.event_date), today))
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

        const past = rawEvents
          .filter(e => isBefore(new Date(e.event_date), today))
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

        if (upcoming.length > 0) setNextEvent(upcoming[0]);
        setEvents(past.slice(0, 3));
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (!nextEvent) return;

    const updateCountdown = () => {
      const now = new Date();
      const eventDate = new Date(nextEvent.event_date);
      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(prev => ({ ...prev, ended: true }));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown({ days, hours, minutes, seconds, ended: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  return (
    <section className="bg-white section py-12 px-4">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Upcoming Events</h2>
        <p className="mt-2 text-gray-600">Mark your calendar and get ready!</p>
      </div>

      {/* Upcoming Event */}
      {nextEvent ? (
        <div className="card max-w-2xl mx-auto mb-12">
          <h3 className="text-2xl font-semibold mb-3">{nextEvent.title}</h3>
          <p className="flex items-center gap-2 text-sm mb-4 text-gray-600">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-red-400" />
            {format(new Date(nextEvent.event_date), 'PPP')}
          </p>

          {countdown.ended ? (
            <p className="text-xl font-bold text-red-500 mt-4">Happening now!</p>
          ) : (
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white text-gray-700 border-2 border-blue-900"
                >
                  <span className="text-2xl font-bold">
                    {item.value.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">No upcoming events yet.</p>
      )}

      {/* Recent Events */}
      {events.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-left italic text-sm text-gray-600 mb-4 ml-1">
            *recent events*
          </h3>
          <div className="card">
            {events.map(ev => (
              <div
                key={ev.id}
                className="mb-4 border-b border-gray-200 pb-4 last:border-none last:pb-0"
              >
                <h4 className="text-base font-semibold">{ev.title}</h4>
                <p className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-red-400" />
                  {format(new Date(ev.event_date), 'PPP')}
                  <span className="mx-2">•</span>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-400" />
                  {ev.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No past events to show.</p>
      )}
    </section>
  );
}
