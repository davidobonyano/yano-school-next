'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen,
  faUsers,
  faChartBar,
  faCalendarAlt,
  faFileAlt,
  faClipboardList,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { mockCourses, mockUsers, mockGrades, Course } from '@/lib/enhanced-mock-data';

interface ExtendedCourse extends Course {
  enrolledStudents?: number;
  averageGrade?: number;
  lastActivity?: string;
  nextClass?: string;
}

export default function AssignedCoursesPage() {
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ExtendedCourse | null>(null);

  // Mock teacher assignments - in real app, this would come from auth/API
  const teacherCourses = ['MATH101', 'PHY101']; // Current teacher's assigned courses

  useEffect(() => {
    // Filter courses assigned to current teacher and add extra data
    const assignedCourses = mockCourses
      .filter(course => teacherCourses.includes(course.id))
      .map(course => {
        // Calculate enrolled students (mock)
        const enrolledStudents = Math.floor(Math.random() * 30) + 15;
        
        // Calculate average grade from mock grades
        const courseGrades = mockGrades.filter(grade => grade.courseId === course.id);
        const averageGrade = courseGrades.length > 0 
          ? courseGrades.reduce((sum, grade) => sum + grade.total, 0) / courseGrades.length 
          : 0;

        return {
          ...course,
          enrolledStudents,
          averageGrade: Math.round(averageGrade),
          lastActivity: '2 days ago',
          nextClass: 'Tomorrow 10:00 AM'
        };
      });

    setCourses(assignedCourses);
  }, []);

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return 'text-green-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faBookOpen} className="w-6 h-6 text-blue-600" />
          My Assigned Courses
        </h1>
        <p className="text-gray-600">Manage and monitor your teaching assignments</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBookOpen} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round(courses.reduce((sum, course) => sum + (course.averageGrade || 0), 0) / courses.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faGraduationCap} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Session</p>
              <p className="text-2xl font-bold text-gray-900">2023/24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                  <p className="text-blue-100">{course.code}</p>
                  <p className="text-blue-100 text-sm">Credits: {course.credits}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600 mb-2" />
                  <div className="text-lg font-bold text-gray-900">{course.enrolledStudents}</div>
                  <div className="text-sm text-gray-500">Students</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-green-600 mb-2" />
                  <div className={`text-lg font-bold ${getGradeColor(course.averageGrade || 0)}`}>
                    {course.averageGrade}%
                  </div>
                  <div className="text-sm text-gray-500">Avg. Grade</div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                  Next Class: {course.nextClass}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2" />
                  Last Activity: {course.lastActivity}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`/dashboard/teacher/results?course=${course.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={faChartBar} className="w-4 h-4" />
                  Manage Grades
                </a>
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FontAwesomeIcon icon={faBookOpen} className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</h3>
          <p className="text-gray-500">You haven&apos;t been assigned any courses yet. Contact the administration for course assignments.</p>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <CourseDetailsModal 
          course={selectedCourse} 
          onClose={() => setSelectedCourse(null)} 
        />
      )}
    </div>
  );
}

// Course Details Modal
function CourseDetailsModal({ 
  course, 
  onClose 
}: { 
  course: ExtendedCourse;
  onClose: () => void;
}) {
  const courseStudents = mockUsers.students.slice(0, course.enrolledStudents || 0);
  const courseGrades = mockGrades.filter(grade => grade.courseId === course.id);

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return 'text-green-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Course Information</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Course Code:</span>
                <span className="ml-2 text-gray-600">{course.code}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Credits:</span>
                <span className="ml-2 text-gray-600">{course.credits}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Semester:</span>
                <span className="ml-2 text-gray-600">{course.semester}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-600">{course.description}</p>
              </div>
            </div>
          </div>

          {/* Class Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Class Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{course.enrolledStudents}</div>
                <div className="text-sm text-gray-600">Enrolled Students</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <FontAwesomeIcon icon={faChartBar} className="h-8 w-8 text-green-600 mb-2" />
                <div className={`text-2xl font-bold ${getGradeColor(course.averageGrade || 0)}`}>
                  {course.averageGrade}%
                </div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/dashboard/teacher/results?course=${course.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faChartBar} className="w-5 h-5" />
              Manage Grades
            </a>
            <a
              href={`/dashboard/teacher/exams?course=${course.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5" />
              Create Exam
            </a>
            <a
              href={`/dashboard/teacher/timetable?course=${course.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5" />
              View Schedule
            </a>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
