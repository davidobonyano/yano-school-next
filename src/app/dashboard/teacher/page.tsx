'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faUsers,
  faCalendarAlt,
  faChartBar,
  faBell,
  faIdCard,
  faGraduationCap,
  faClipboardList,
  faArrowRight,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherDashboardPage() {
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [processingStudents, setProcessingStudents] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [studentsWithResults, setStudentsWithResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  type Announcement = {
    id: string;
    title: string;
    body: string;
    audience: 'students'|'teachers'|'admins'|'all'|'class'|'role';
    created_at: string;
    expires_at: string | null;
    audience_role?: 'student'|'teacher'|'admin' | null;
  };

  useEffect(() => {
    // TODO: Replace with real API calls
    const fetchDashboardData = async () => {
      try {
        // Fetch teacher data
        // const teacherResponse = await fetch('/api/teachers/me');
        // const teacherData = await teacherResponse.json();
        // setTeacher(teacherData);

        // Fetch assigned courses
        // const coursesResponse = await fetch('/api/teachers/courses');
        // const coursesData = await coursesResponse.json();
        // setAssignedCourses(coursesData.courses || []);

        // Fetch processing students
        // const studentsResponse = await fetch('/api/teachers/processing-students');
        // const studentsData = await studentsResponse.json();
        // setProcessingStudents(studentsData.students || []);

        // Fetch upcoming exams
        // const examsResponse = await fetch('/api/teachers/upcoming-exams');
        // const examsData = await examsResponse.json();
        // setUpcomingExams(examsData.exams || []);

        // Fetch students with results count
        // const resultsResponse = await fetch('/api/teachers/students-with-results');
        // const resultsData = await resultsResponse.json();
        // setStudentsWithResults(resultsData.count || 0);

        // Fetch announcements
        // const announcementsResponse = await fetch('/api/announcements?audience=teachers');
        // const announcementsData = await announcementsResponse.json();
        // setAnnouncements(announcementsData.announcements || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Assigned Courses',
      value: assignedCourses.length,
      icon: faBookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/teacher/courses'
    },
    {
      title: 'Pending Student IDs',
      value: processingStudents.length,
      icon: faUsers, // Changed from faUserCheck
      color: 'bg-orange-500',
      href: '/dashboard/teacher/students'
    },
    {
      title: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: faCalendarAlt, // Changed from faClipboardList
      color: 'bg-purple-500',
      href: '/dashboard/teacher/exams'
    },
    {
      title: 'Students with Results',
      value: studentsWithResults,
      icon: faChartBar,
      color: 'bg-green-500',
      href: '/dashboard/teacher/results'
    }
  ];

  const todaySchedule = [
    { time: '8:00-8:45', subject: 'Mathematics', class: 'JSS2A', room: 'Room 101' },
    { time: '10:30-11:15', subject: 'Mathematics', class: 'JSS2B', room: 'Room 101' },
    { time: '2:00-2:45', subject: 'Mathematics', class: 'JSS3A', room: 'Room 101' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {teacher?.name || 'Teacher'}!
        </h1>
        <p className="text-gray-600">Here's what's happening in your classes today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <a
            key={index}
            href={stat.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <FontAwesomeIcon icon={stat.icon} className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-blue-600 mr-2" /> {/* Changed from faClock */}
              Today's Schedule
            </h2>
            <a href="/dashboard/teacher/timetable" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Full Timetable →
            </a>
          </div>
          
          {todaySchedule.length > 0 ? (
            <div className="space-y-4">
              {todaySchedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900 w-20">{schedule.time}</div>
                    <div>
                      <div className="font-medium text-gray-900">{schedule.subject}</div>
                      <div className="text-sm text-gray-600">{schedule.class}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{schedule.room}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-12 w-12 text-gray-300 mb-4" /> {/* Changed from faClock */}
              <p>No classes scheduled for today</p>
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faClipboardList} className="h-5 w-5 text-orange-600 mr-2" />
              Recent Announcements
            </h2>
            <a href="/dashboard/teacher/announcements" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
              View All →
            </a>
          </div>
          
          {/* announcements.length > 0 ? ( // Removed announcements state usage
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{announcement.body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : ( */}
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faClipboardList} className="h-12 w-12 text-gray-300 mb-4" />
              <p>No recent announcements</p>
            </div>
          {/* )} */}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/teacher/exams"
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-purple-600" /> {/* Changed from faClipboardList */}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Manage Exams</h3>
                <p className="text-sm text-gray-600">Create and manage exams</p>
              </div>
            </div>
          </a>
          
          <a
            href="/dashboard/teacher/results"
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Grade Results</h3>
                <p className="text-sm text-gray-600">Update student grades</p>
              </div>
            </div>
          </a>
          
          <a
            href="/dashboard/teacher/students"
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-orange-600" /> {/* Changed from faUserCheck */}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Manage Students</h3>
                <p className="text-sm text-gray-600">View and manage students</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}