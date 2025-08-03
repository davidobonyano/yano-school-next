'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faChartBar, 
  faCalendar, 
  faBell,
  faClock,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../../components/DashboardLayout';
import { AuthService, AuthUser } from '../../../lib/auth-service';
import '../../../lib/fontawesome';

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'student') {
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
    courses: 6,
    averageGrade: 85.5,
    assignmentsDue: 3,
    attendance: 92
  };

  const recentActivities = [
    {
      id: 1,
      type: 'assignment',
      title: 'Math Assignment #5 submitted',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'grade',
      title: 'Science Quiz grade received',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'announcement',
      title: 'New course material available',
      time: '2 days ago',
      status: 'pending'
    }
  ];

  const upcomingAssignments = [
    {
      id: 1,
      title: 'English Essay',
      course: 'English Literature',
      dueDate: '2024-01-15',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      course: 'Physics',
      dueDate: '2024-01-18',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'History Quiz',
      course: 'World History',
      dueDate: '2024-01-20',
      priority: 'low'
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
              Here&apos;s what&apos;s happening with your studies today.
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faBook} className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Courses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.courses}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faChartBar} className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Grade
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.averageGrade}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faClock} className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Due This Week
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.assignmentsDue}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faCalendar} className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Attendance
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.attendance}%
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

          {/* Upcoming Assignments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Assignments</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {assignment.course}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : assignment.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.priority}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Courses</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Check Grades</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Assignments</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faBell} className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Notifications</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}