'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChalkboardTeacher, 
  faUsers, 
  faGraduationCap, 
  faChartBar,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../../components/DashboardLayout';
import { AuthService, AuthUser } from '../../../lib/auth-service';
import '../../../lib/fontawesome';

export default function TeacherDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'teacher') {
        window.location.href = '/login';
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // Mock data - in real app, this would come from your database
  const stats = {
    classes: 4,
    students: 120,
    assignmentsToGrade: 8,
    averageAttendance: 94
  };

  const recentActivities = [
    {
      id: 1,
      type: 'grade',
      title: 'Math Quiz grades submitted',
      time: '1 hour ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'assignment',
      title: 'New assignment created for Physics',
      time: '3 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Attendance marked for Class 10A',
      time: '1 day ago',
      status: 'completed'
    }
  ];

  const upcomingClasses = [
    {
      id: 1,
      name: 'Mathematics 10A',
      time: '09:00 AM',
      students: 25,
      room: 'Room 201'
    },
    {
      id: 2,
      name: 'Physics 11B',
      time: '11:00 AM',
      students: 22,
      room: 'Lab 3'
    },
    {
      id: 3,
      name: 'Advanced Calculus',
      time: '02:00 PM',
      students: 18,
      room: 'Room 105'
    }
  ];

  const pendingAssignments = [
    {
      id: 1,
      title: 'Algebra Quiz',
      class: 'Mathematics 10A',
      submissions: 23,
      total: 25,
      dueDate: '2024-01-15'
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      class: 'Physics 11B',
      submissions: 18,
      total: 22,
      dueDate: '2024-01-18'
    },
    {
      id: 3,
      title: 'Calculus Problem Set',
      class: 'Advanced Calculus',
      submissions: 15,
      total: 18,
      dueDate: '2024-01-20'
    }
  ];

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
                      <p className="text-gray-600">
              Here&apos;s your teaching overview for today.
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Classes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.classes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.students}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faGraduationCap} className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    To Grade
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.assignmentsToGrade}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faChartBar} className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Attendance
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.averageAttendance}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === 'completed' ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-500" />
                      ) : (
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Today&apos;s Classes</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {classItem.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {classItem.room} • {classItem.students} students
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {classItem.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Pending Assignments</h3>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Create Assignment
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {assignment.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {assignment.class}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {assignment.submissions}/{assignment.total} submitted
                      </div>
                      <div className="mt-1">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(assignment.submissions / assignment.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <button className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Grade Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">My Classes</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faGraduationCap} className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Grade Assignments</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Student Management</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}