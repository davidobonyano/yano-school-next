'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faBookOpen,
  faChartBar,
  faUserCheck,
  faClock,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers, mockCourses, mockExams, mockGrades } from '@/lib/enhanced-mock-data';

export default function TeacherDashboardPage() {
  const teacher = mockUsers.teachers[0]; // Replace with real auth data
  
  // Mock assigned courses for this teacher
  const assignedCourses = mockCourses.filter(course => 
    ['Dr. Smith', 'Mrs. Johnson', 'Dr. Brown'].includes(course.instructor)
  );
  
  // Students pending ID assignment
  const processingStudents = mockUsers.students.filter(s => s.status === 'processing');
  
  // Recent exams
  const upcomingExams = mockExams.filter(exam => exam.status === 'Upcoming').slice(0, 3);
  
  // Students needing results
  const studentsWithResults = mockGrades.length;

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
      icon: faUserCheck,
      color: 'bg-orange-500',
      href: '/dashboard/teacher/student-ids'
    },
    {
      title: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: faClipboardList,
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {teacher.name}</h1>
        <p className="text-gray-600">Manage your classes and students</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <a
            key={index}
            href={stat.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <FontAwesomeIcon icon={stat.icon} className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Quick Actions & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/teacher/student-ids"
              className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <FontAwesomeIcon icon={faUserCheck} className="h-5 w-5 text-orange-600 mr-3" />
              <span className="text-orange-700 font-medium">Assign Student IDs</span>
              {processingStudents.length > 0 && (
                <span className="ml-auto bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs">
                  {processingStudents.length} pending
                </span>
              )}
            </a>
            <a
              href="/dashboard/teacher/exams"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FontAwesomeIcon icon={faClipboardList} className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-purple-700 font-medium">Create New Exam</span>
            </a>
            <a
              href="/dashboard/teacher/results"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-700 font-medium">Update Student Results</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h2>
          <div className="space-y-3">
            {todaySchedule.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-indigo-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{item.subject}</div>
                    <div className="text-sm text-gray-500">{item.class} • {item.room}</div>
                  </div>
                </div>
                <span className="text-indigo-700 font-medium text-sm">{item.time}</span>
              </div>
            ))}
            <a
              href="/dashboard/teacher/timetable"
              className="block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium py-2"
            >
              View Full Timetable
            </a>
          </div>
        </div>
      </div>

      {/* Pending Tasks & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {processingStudents.length > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Student ID Assignment</div>
                  <div className="text-sm text-gray-500">{processingStudents.length} students need IDs</div>
                </div>
              </div>
            )}
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Grade Submissions</div>
                <div className="text-sm text-gray-500">Mid-term results due next week</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <FontAwesomeIcon icon={faClipboardList} className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Exam Preparation</div>
                <div className="text-sm text-gray-500">3 upcoming exams to manage</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams</h2>
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{exam.courseName}</div>
                  <div className="text-sm text-gray-500">{exam.date} • {exam.time}</div>
                  <div className="text-sm text-gray-500">{exam.venue}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{exam.duration} min</div>
                  <div className="text-xs text-gray-500">{exam.status}</div>
                </div>
              </div>
            ))}
            <a
              href="/dashboard/teacher/exams"
              className="block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium py-2"
            >
              Manage All Exams
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}