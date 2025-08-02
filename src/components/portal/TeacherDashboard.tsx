'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../auth/AuthProvider'

interface Course {
  id: string
  title: string
  description: string
  student_count: number
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacherCourses()
  }, [])

  const fetchTeacherCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          enrollments (count)
        `)
        .eq('teacher_id', user?.id)

      if (error) throw error

      const coursesWithCount = data?.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        student_count: course.enrollments?.[0]?.count || 0
      })) || []

      setCourses(coursesWithCount)
    } catch (error) {
      console.error('Error fetching courses:', error)
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-green-600">
            {courses.reduce((sum, course) => sum + course.student_count, 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Courses</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {courses.filter(course => course.student_count > 0).length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg. Students</h3>
          <p className="text-3xl font-bold text-purple-600">
            {courses.length > 0 
              ? Math.round(courses.reduce((sum, course) => sum + course.student_count, 0) / courses.length)
              : 0
            }
          </p>
        </motion.div>
      </div>

      {/* Course Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">My Courses</h2>
          <a
            href="/portal/courses/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Course
          </a>
        </div>
        
        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
              <a
                href="/portal/courses/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Course
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {course.student_count} students
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex space-x-2">
                    <a
                      href={`/portal/course/${course.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Course →
                    </a>
                    <a
                      href={`/portal/course/${course.id}/students`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Manage Students →
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/portal/courses/create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">+</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Create Course</h3>
                <p className="text-sm text-gray-500">Add a new course</p>
              </div>
            </a>

            <a
              href="/portal/assignments"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">📝</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Assignments</h3>
                <p className="text-sm text-gray-500">Manage assignments</p>
              </div>
            </a>

            <a
              href="/portal/grades"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-600 font-bold">📊</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Grades</h3>
                <p className="text-sm text-gray-500">View and grade</p>
              </div>
            </a>

            <a
              href="/portal/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">📈</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Analytics</h3>
                <p className="text-sm text-gray-500">View insights</p>
              </div>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}