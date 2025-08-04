'use client';

import { useState, useEffect } from 'react';
import { getStudentSchedule, ScheduleItem } from '@/lib/enhanced-mock-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faCalendarDays } from '@fortawesome/free-solid-svg-icons';

const timeSlots = [
  '8:00-8:45',
  '8:45-9:30',
  '9:30-10:15',
  '10:15-10:30', // Break
  '10:30-11:15',
  '11:15-12:00',
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjectColors: { [key: string]: string } = {
  'Mathematics': 'bg-blue-100 text-blue-800 border-blue-200',
  'Physics': 'bg-purple-100 text-purple-800 border-purple-200',
  'Chemistry': 'bg-green-100 text-green-800 border-green-200',
  'Biology': 'bg-orange-100 text-orange-800 border-orange-200',
  'English Language': 'bg-pink-100 text-pink-800 border-pink-200',
  'Break': 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setSchedule(getStudentSchedule());
    setCurrentTime(new Date());

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentDay = () => {
    if (!currentTime) return '';
    const today = currentTime.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[today];
  };

  const getCurrentTimeSlot = () => {
    if (!currentTime) return null;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const timeRanges = [
      { start: 8 * 60, end: 8 * 60 + 45, slot: '8:00-8:45' },
      { start: 8 * 60 + 45, end: 9 * 60 + 30, slot: '8:45-9:30' },
      { start: 9 * 60 + 30, end: 10 * 60 + 15, slot: '9:30-10:15' },
      { start: 10 * 60 + 15, end: 10 * 60 + 30, slot: '10:15-10:30' },
      { start: 10 * 60 + 30, end: 11 * 60 + 15, slot: '10:30-11:15' },
      { start: 11 * 60 + 15, end: 12 * 60, slot: '11:15-12:00' },
    ];

    const currentSlot = timeRanges.find(range => now >= range.start && now <= range.end);
    return currentSlot?.slot || null;
  };

  const getScheduleItem = (day: string, time: string) => {
    return schedule.find(item => item.day === day && item.time === time);
  };

  const isCurrentSlot = (day: string, time: string) => {
    return day === getCurrentDay() && time === getCurrentTimeSlot();
  };

  const handlePrint = () => {
    window.print();
  };

  const renderScheduleCell = (day: string, time: string) => {
    const item = getScheduleItem(day, time);
    const isBreak = item?.subject === 'Break';
    const isCurrent = isCurrentSlot(day, time);

    if (!item) {
      return (
        <div className="p-2 h-20 border border-gray-200">
          <div className="text-xs text-gray-400">Free Period</div>
        </div>
      );
    }

    const colorClass = subjectColors[item.subject] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <div
        className={`p-2 h-20 border rounded-lg ${colorClass} ${
          isCurrent ? 'ring-2 ring-blue-500 ring-opacity-75 shadow-lg' : ''
        } ${isBreak ? 'flex items-center justify-center' : ''}`}
      >
        {isBreak ? (
          <div className="text-center">
            <div className="font-medium text-sm">Break Time</div>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="font-medium text-sm leading-tight mb-1">{item.subject}</div>
              <div className="text-xs opacity-75">{item.teacher}</div>
            </div>
            <div className="text-xs font-medium mt-1">{item.room}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Class Schedule</h1>
          {currentTime && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 mr-1" />
              <span>Current time: {currentTime.toLocaleTimeString()}</span>
              {getCurrentDay() !== 'Saturday' && getCurrentDay() !== 'Sunday' && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {getCurrentDay()}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
        >
          <FontAwesomeIcon icon={faPrint} className="h-4 w-4 mr-2" />
          Print Schedule
        </button>
      </div>

      {/* Desktop Timetable */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Time
                </th>
                {days.map(day => (
                  <th
                    key={day}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      day === getCurrentDay() ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50">
                    {timeSlot}
                  </td>
                  {days.map(day => (
                    <td key={`${day}-${timeSlot}`} className="px-2 py-2">
                      {renderScheduleCell(day, timeSlot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-6">
        {days.map(day => (
          <div key={day} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div
              className={`px-4 py-3 font-medium ${
                day === getCurrentDay() ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-800'
              }`}
            >
              {day}
              {day === getCurrentDay() && (
                <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                  Today
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {timeSlots.map(timeSlot => {
                const item = getScheduleItem(day, timeSlot);
                const isBreak = item?.subject === 'Break';
                const isCurrent = isCurrentSlot(day, timeSlot);

                if (!item) return null;

                const colorClass = subjectColors[item.subject] || 'bg-gray-100 text-gray-800 border-gray-200';

                return (
                  <div
                    key={timeSlot}
                    className={`p-3 rounded-lg border ${colorClass} ${
                      isCurrent ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{item.subject}</div>
                      <div className="text-xs font-medium bg-white bg-opacity-50 px-2 py-1 rounded">
                        {timeSlot}
                      </div>
                    </div>
                    {!isBreak && (
                      <div className="space-y-1">
                        <div className="text-sm opacity-75">{item.teacher}</div>
                        <div className="text-sm font-medium">{item.room}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(subjectColors).map(([subject, colorClass]) => (
            <div key={subject} className={`px-3 py-2 rounded-lg border text-center ${colorClass}`}>
              <div className="text-sm font-medium">{subject}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          .bg-blue-100,
          .bg-purple-100,
          .bg-green-100,
          .bg-orange-100,
          .bg-pink-100,
          .bg-gray-100 {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
