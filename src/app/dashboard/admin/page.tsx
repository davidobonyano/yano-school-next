'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faBook, 
  faCog, 
  faChartBar,
  faShieldAlt,
  faUserPlus,
  faExclamationTriangle,
  faCheckCircle,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../../components/DashboardLayout';
import { AuthService, AuthUser } from '../../../lib/auth-service';
import '../../../lib/fontawesome';

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
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
    totalUsers: 450,
    activeStudents: 380,
    activeTeachers: 45,
    systemHealth: 98
  };

  const recentActivities = [
    {
      id: 1,
      type: 'user',
      title: 'New student account created',
      time: '30 minutes ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'system',
      title: 'System backup completed',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'security',
      title: 'Security audit initiated',
      time: '1 day ago',
      status: 'pending'
    }
  ];

  const systemAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Storage space at 85%',
      description: 'Consider cleaning up old files',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'info',
      title: 'New software update available',
      description: 'Version 2.1.0 ready for deployment',
      time: '1 day ago'
    }
  ];

  const userManagement = [
    {
      id: 1,
      name: 'Student Registration',
      count: 25,
      status: 'pending',
      icon: faUserPlus
    },
    {
      id: 2,
      name: 'Teacher Applications',
      count: 3,
      status: 'pending',
      icon: faUserPlus
    },
    {
      id: 3,
      name: 'Account Deactivations',
      count: 8,
      status: 'completed',
      icon: faUsers
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
              Here&apos;s your system overview and management dashboard.
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faBook} className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeStudents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faShieldAlt} className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Teachers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeTeachers}
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
                    System Health
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.systemHealth}%
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

          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`border-l-4 pl-4 ${
                    alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {alert.description}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.type === 'warning' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {alert.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add User
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userManagement.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={item.icon} className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {item.count} items
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <button className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                    Manage
                  </button>
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
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">User Management</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Course Management</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faCog} className="h-6 w-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">System Settings</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Reports</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}