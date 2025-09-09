'use client';

import { useEffect, useState } from 'react';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';
import { getStudentSession } from '@/lib/student-session';

interface TimetableItem {
  class: string;
  subject: string;
  teacher_name: string;
  day: string; // Monday - Friday
  period: string; // e.g., 8:00 - 9:00
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = [
  '8:00 - 9:00',
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 2:00',
  '2:00 - 3:00',
];

function normalizeStream(stream?: string | null): string | null {
  if (!stream) return null;
  const s = String(stream).toLowerCase().trim();
  if (s === 'art' || s === 'arts') return 'Arts';
  if (s === 'commercial' || s === 'commerce') return 'Commercial';
  if (s === 'science' || s === 'sciences') return 'Science';
  return stream as string;
}

export default function StudentTimetablePage() {
  const { academicContext } = useGlobalAcademicContext();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentClass, setStudentClass] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<string>('');

  const computeStudentClass = () => {
    const s = getStudentSession();
    const level = s?.class_level || '';
    const stream = normalizeStream(s?.stream);
    if (level && level.startsWith('SS') && stream) {
      return `${level} ${stream}`;
    }
    return level;
  };

  const refetch = async (effectiveClass: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'by_student',
        session_id: academicContext.sessionId,
        term_id: academicContext.termId,
      });
      if (effectiveClass) params.set('class', effectiveClass);
      const res = await fetch(`/api/timetables?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const effective = computeStudentClass();
    setStudentClass(effective);
    
    // Set current day
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setCurrentDay(dayNames[today.getDay()]);
  }, []);

  useEffect(() => {
    if (!academicContext.sessionId || !academicContext.termId) return;
    refetch(studentClass);
  }, [academicContext.sessionId, academicContext.termId, studentClass]);

  useEffect(() => {
    const handler = () => refetch(studentClass);
    window.addEventListener('timetableUpdated', handler as EventListener);
    return () => window.removeEventListener('timetableUpdated', handler as EventListener);
  }, [studentClass]);

  const getTodaysClassCount = () => {
    if (!currentDay || currentDay === 'Sunday' || currentDay === 'Saturday') return 0;
    
    const todaysItems = items.filter(item => 
      item.day === currentDay && 
      item.subject && 
      item.subject.toLowerCase() !== 'break' &&
      item.subject.trim() !== ''
    );
    
    return todaysItems.length;
  };

  if (!mounted) return null;
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">My Timetable</h1>
            <p className="text-sm text-black/70">{academicContext.session} • {academicContext.term}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-black/70">Today's Classes</div>
            <div className="text-2xl font-bold text-black">{getTodaysClassCount()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10 bg-white">
                <th className="text-left text-xs uppercase tracking-wider text-black/70 p-3 w-28">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="text-left text-xs uppercase tracking-wider text-black/70 p-3">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-6 text-center text-black/60" colSpan={6}>Loading…</td></tr>
              ) : (
                TIMES.map(t => (
                  <tr key={t} className="border-t border-black/10">
                    <td className="p-3 text-sm font-medium text-black">{t}</td>
                    {DAYS.map(day => {
                      const cell = items.find(i => i.day === day && i.period === t);
                      return (
                        <td key={`${day}-${t}`} className="p-3 align-top">
                          {cell ? (
                            <div className="border border-black/20 rounded p-2">
                              <div className="text-sm font-semibold text-black">{cell.subject}</div>
                              <div className="text-xs text-black/70">{cell.teacher_name}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-black/40">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 