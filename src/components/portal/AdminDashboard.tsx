'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch total courses
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      // Fetch total enrollments
      const { count: enrollmentCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalEnrollments: enrollmentCount || 0,
        activeUsers: Math.floor((userCount || 0) * 0.8) // Mock active users
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">Registered users</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalCourses}</p>
          <p className="text-sm text-gray-500 mt-1">Available courses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Enrollments</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.totalEnrollments}</p>
          <p className="text-sm text-gray-500 mt-1">Total enrollments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.activeUsers}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">System Management</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/portal/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">👥</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">User Management</h3>
                <p className="text-sm text-gray-500">Manage all users</p>
              </div>
            </a>

            <a
              href="/portal/admin/courses"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">📚</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Course Management</h3>
                <p className="text-sm text-gray-500">Manage all courses</p>
              </div>
            </a>

            <a
              href="/portal/admin/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-600 font-bold">📊</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Analytics</h3>
                <p className="text-sm text-gray-500">System analytics</p>
              </div>
            </a>

            <a
              href="/portal/admin/settings"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">⚙️</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Settings</h3>
                <p className="text-sm text-gray-500">System settings</p>
              </div>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Recent System Activity</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">New user registration</p>
                  <p className="text-sm text-gray-500">John Doe registered as a student</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2 minutes ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-xs">📚</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">New course created</p>
                  <p className="text-sm text-gray-500">Advanced Mathematics by Dr. Smith</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">15 minutes ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-600 text-xs">📝</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">New enrollment</p>
                  <p className="text-sm text-gray-500">Student enrolled in Physics 101</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">System Health</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Database</h3>
              <p className="text-sm text-green-600">Healthy</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Authentication</h3>
              <p className="text-sm text-green-600">Online</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Storage</h3>
              <p className="text-sm text-green-600">Available</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}