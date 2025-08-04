'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faBookOpen,
  faCreditCard,
  faBullhorn,
  faChartLine,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers, mockCourses, mockPayments } from '@/lib/enhanced-mock-data';

export default function AdminDashboardPage() {
  const totalStudents = mockUsers.students.length;
  const totalTeachers = mockUsers.teachers.length;
  const totalCourses = mockCourses.length;
  const totalRevenue = mockPayments.reduce((sum, payment) => 
    payment.status === 'Paid' ? sum + payment.amount : sum, 0
  );

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: faUserGraduate,
      color: 'bg-blue-500',
      href: '/dashboard/admin/students'
    },
    {
      title: 'Total Teachers',
      value: totalTeachers,
      icon: faChalkboardTeacher,
      color: 'bg-green-500',
      href: '/dashboard/admin/teachers'
    },
    {
      title: 'Active Courses',
      value: totalCourses,
      icon: faBookOpen,
      color: 'bg-purple-500',
      href: '/dashboard/admin/courses'
    },
    {
      title: 'Revenue (₦)',
      value: totalRevenue.toLocaleString(),
      icon: faCreditCard,
      color: 'bg-yellow-500',
      href: '/dashboard/admin/payments'
    }
  ];

  const recentPayments = mockPayments
    .filter(payment => payment.status === 'Pending')
    .slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUserShield} className="text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-red-100">Manage your school&apos;s operations</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <a
              href={stat.href}
              className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className={`${stat.color} rounded-xl p-4 mr-4`}>
                  <FontAwesomeIcon icon={stat.icon} className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/admin/students/create"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FontAwesomeIcon icon={faUserGraduate} className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-blue-700 font-medium">Add New Student</span>
            </a>
            <a
              href="/dashboard/admin/teachers/create"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FontAwesomeIcon icon={faChalkboardTeacher} className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-700 font-medium">Add New Teacher</span>
            </a>
            <a
              href="/dashboard/admin/announcements"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FontAwesomeIcon icon={faBullhorn} className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-purple-700 font-medium">Post Announcement</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Payments</h2>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.description}</p>
                  <p className="text-sm text-gray-500">Student ID: {payment.studentId}</p>
                </div>
                <span className="text-yellow-700 font-bold">₦{payment.amount.toLocaleString()}</span>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No pending payments</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{mockPayments.filter(p => p.status === 'Paid').length}</p>
            <p className="text-sm text-gray-500">Completed Payments</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faUserGraduate} className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{mockUsers.students.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Active Students</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faBookOpen} className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{mockCourses.filter(c => c.status === 'Active').length}</p>
            <p className="text-sm text-gray-500">Active Courses</p>
          </div>
        </div>
      </div>
    </div>
  );
}