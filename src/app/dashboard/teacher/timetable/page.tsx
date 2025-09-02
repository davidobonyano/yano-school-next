'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faChevronLeft,
  faChevronRight,
  faDownload,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  class: string;
  room: string;
  duration: number;
}

export default function TeacherTimetablePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        // const response = await fetch('/api/teachers/timetable');
        // const data = await response.json();
        // setTimetable(data.timetable || []);
        
        // For now, set empty array
        setTimetable([]);
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setTimetable([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i);
      dates.push(newDate);
    }
    return dates;
  };

  const getTimetableForDay = (day: string) => {
    return timetable.filter(entry => entry.day === day);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeek(newDate);
  };

  const exportTimetable = () => {
    // TODO: Implement export functionality
    console.log('Exporting timetable...');
  };

  const printTimetable = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-blue-600" />
            My Timetable
          </h1>
          <p className="text-gray-600">View and manage your class schedule</p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={exportTimetable}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={printTimetable}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            Previous Week
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Week of {getWeekDates(currentWeek)[0].toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })} - {getWeekDates(currentWeek)[4].toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Next Week
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-6 gap-px bg-gray-200">
          {/* Header Row */}
          <div className="bg-gray-50 p-4 font-semibold text-gray-900">Time</div>
          {days.map(day => (
            <div key={day} className="bg-gray-50 p-4 font-semibold text-gray-900 text-center">
              {day}
            </div>
          ))}
          
          {/* Time Slots */}
          {['8:00-8:45', '8:45-9:30', '9:30-10:15', '10:30-11:15', '11:15-12:00', '12:00-12:45', '2:00-2:45', '2:45-3:30'].map(timeSlot => (
            <div key={timeSlot} className="bg-gray-50 p-3 text-sm text-gray-600 border-r">
              {timeSlot}
            </div>
          ))}
          
          {/* Timetable Entries */}
          {days.map(day => {
            const dayEntries = getTimetableForDay(day);
            return (
              <div key={day} className="bg-white">
                {dayEntries.length > 0 ? (
                  dayEntries.map(entry => (
                    <div key={entry.id} className="p-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{entry.subject}</div>
                      <div className="text-sm text-gray-600">{entry.class}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                        {entry.room}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-400 text-center text-sm">No classes</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {timetable.length === 0 && !loading && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faCalendarAlt} className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Found</h3>
          <p className="text-gray-500">
            Your timetable hasn't been set up yet. Please contact the administration office.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Schedule Changes</h4>
            <p className="text-sm text-gray-600 mb-3">
              Need to request a schedule change or report a conflict?
            </p>
            <a 
              href="/contact" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Contact Admin →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Room Issues</h4>
            <p className="text-sm text-gray-600 mb-3">
              Having trouble with your assigned classroom or need equipment?
            </p>
            <span className="text-blue-600 text-sm font-medium">
              📧 Report Issue
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
