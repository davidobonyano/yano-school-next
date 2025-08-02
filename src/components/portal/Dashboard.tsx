'use client'

import { useAuth } from '../auth/AuthProvider'
import { motion } from 'framer-motion'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'
import AdminDashboard from './AdminDashboard'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to access the portal</h2>
          <a href="/portal/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  const userRole = user.user_metadata?.role || 'student'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="text-gray-600">
            Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </p>
        </div>

        {userRole === 'student' && <StudentDashboard />}
        {userRole === 'teacher' && <TeacherDashboard />}
        {userRole === 'admin' && <AdminDashboard />}
      </div>
    </motion.div>
  )
}