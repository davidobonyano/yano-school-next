'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faDownload
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

  // Mock teacher's timetable
  const timetable: TimetableEntry[] = [
    // Monday
    { id: '1', day: 'Monday', time: '8:00-8:45', subject: 'Mathematics', class: 'JSS2A', room: 'Room 101', duration: 45 },
    { id: '2', day: 'Monday', time: '10:30-11:15', subject: 'Mathematics', class: 'JSS2B', room: 'Room 101', duration: 45 },
    { id: '3', day: 'Monday', time: '2:00-2:45', subject: 'Mathematics', class: 'JSS3A', room: 'Room 101', duration: 45 },
    
    // Tuesday
    { id: '4', day: 'Tuesday', time: '8:45-9:30', subject: 'Mathematics', class: 'JSS1A', room: 'Room 101', duration: 45 },
    { id: '5', day: 'Tuesday', time: '11:15-12:00', subject: 'Mathematics', class: 'JSS2A', room: 'Room 101', duration: 45 },
    { id: '6', day: 'Tuesday', time: '2:45-3:30', subject: 'Mathematics', class: 'JSS3B', room: 'Room 101', duration: 45 },
    
    // Wednesday
    { id: '7', day: 'Wednesday', time: '9:30-10:15', subject: 'Mathematics', class: 'JSS2A', room: 'Room 101', duration: 45 },
    { id: '8', day: 'Wednesday', time: '11:15-12:00', subject: 'Mathematics', class: 'JSS1B', room: 'Room 101', duration: 45 },
    
    // Thursday
    { id: '9', day: 'Thursday', time: '8:00-8:45', subject: 'Mathematics', class: 'JSS3A', room: 'Room 101', duration: 45 },
    { id: '10', day: 'Thursday', time: '11:15-12:00', subject: 'Mathematics', class: 'JSS2B', room: 'Room 101', duration: 45 },
    { id: '11', day: 'Thursday', time: '2:00-2:45', subject: 'Mathematics', class: 'JSS1A', room: 'Room 101', duration: 45 },
    
    // Friday
    { id: '12', day: 'Friday', time: '10:30-11:15', subject: 'Mathematics', class: 'JSS3B', room: 'Room 101', duration: 45 },
    { id: '13', day: 'Friday', time: '11:15-12:00', subject: 'Mathematics', class: 'JSS1B', room: 'Room 101', duration: 45 },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-10:30', '10:30-11:15', 
    '11:15-12:00', '12:00-1:00', '1:00-1:45', '1:45-2:30', '2:30-3:15', '2:00-2:45', '2:45-3:30'
  ];

  const getClassForTimeSlot = (day: string, time: string) => {
    return timetable.find(entry => entry.day === day && entry.time === time);
  };

  const getTotalClassesPerDay = (day: string) => {
    return timetable.filter(entry => entry.day === day).length;
  };

  const getWeekDateRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Friday
    
    return {
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const totalWeeklyClasses = timetable.length;
  const totalWeeklyHours = timetable.reduce((sum, entry) => sum + (entry.duration / 60), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-indigo-600" />
            My Teaching Timetable
          </h1>
          <p className="text-gray-600">View your weekly class schedule</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
          Export Schedule
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Week of {getWeekDateRange().start} - {getWeekDateRange().end}
            </h2>
            <p className="text-sm text-gray-500">
              {currentWeek.getFullYear()}
            </p>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Weekly Classes</p>
              <p className="text-2xl font-bold text-gray-900">{totalWeeklyClasses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Teaching Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalWeeklyHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Days</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Schedule Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {days.map((day) => (
          <div key={day} className="bg-white rounded-lg shadow">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg">
              <h3 className="font-semibold">{day}</h3>
              <p className="text-sm text-indigo-200">{getTotalClassesPerDay(day)} classes</p>
            </div>
            <div className="p-4 space-y-3">
              {timetable
                .filter(entry => entry.day === day)
                .map((entry) => (
                  <div key={entry.id} className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-600">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-900">{entry.time}</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">{entry.subject}</div>
                    <div className="text-xs text-gray-600">{entry.class}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{entry.room}</span>
                    </div>
                  </div>
                ))}
              {getTotalClassesPerDay(day) === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 mb-2" />
                  <p className="text-sm">No classes</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Timetable Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const classEntry = getClassForTimeSlot(day, timeSlot);
                    return (
                      <td key={day} className="px-6 py-4 whitespace-nowrap">
                        {classEntry ? (
                          <div className="bg-indigo-100 p-2 rounded border-l-4 border-indigo-600">
                            <div className="text-sm font-medium text-indigo-900">{classEntry.subject}</div>
                            <div className="text-xs text-indigo-700">{classEntry.class}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                              {classEntry.room}
                            </div>
                          </div>
                        ) : timeSlot === '10:15-10:30' ? (
                          <div className="bg-yellow-100 p-2 rounded text-center">
                            <span className="text-xs text-yellow-800 font-medium">Break</span>
                          </div>
                        ) : timeSlot === '12:00-1:00' ? (
                          <div className="bg-orange-100 p-2 rounded text-center">
                            <span className="text-xs text-orange-800 font-medium">Lunch</span>
                          </div>
                        ) : (
                          <div className="text-gray-300 text-center">
                            <span className="text-xs">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Schedule Notes:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All classes are 45 minutes duration</li>
          <li>• Break time: 10:15-10:30 AM</li>
          <li>• Lunch break: 12:00-1:00 PM</li>
          <li>• Report to your assigned classroom 5 minutes before class starts</li>
          <li>• Contact administration for any schedule changes</li>
        </ul>
      </div>
    </div>
  );
}
