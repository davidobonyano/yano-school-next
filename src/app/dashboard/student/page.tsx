'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { mockUsers, getStudentCourses, getStudentGrades, getStudentPayments, getUpcomingExams, generateExamLink } from '@/lib/enhanced-mock-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faChartBar, faCreditCard, faCalendarAlt, faExternalLinkAlt, faPlay, faUser } from '@fortawesome/free-solid-svg-icons';

export default function StudentDashboard() {
  const student = mockUsers.students[0]; // Replace with real auth data
  const courses = getStudentCourses();
  const grades = getStudentGrades(student.id, 'First Term', '2023/2024');
  const payments = getStudentPayments(student.id);
  const upcomingExams = getUpcomingExams();

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((sum, grade) => sum + grade.total, 0);
    return (total / grades.length / 100 * 4).toFixed(1);
  };

  const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl shadow-xl text-white"
      >
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/30 overflow-hidden backdrop-blur-sm">
            <div className="h-full w-full bg-white/10 flex items-center justify-center text-white text-4xl font-bold">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">Welcome, {student.name}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div>
              <span className="font-medium text-blue-200">Student ID:</span>
              <div className="text-white font-semibold">{student.id}</div>
            </div>
            <div>
              <span className="font-medium text-blue-200">Class:</span>
              <div className="text-white font-semibold">{student.class || 'Form 4 Science'}</div>
            </div>
            <div>
              <span className="font-medium text-blue-200">Stream:</span>
              <div className="text-white font-semibold">Science</div>
            </div>
            <div>
              <span className="font-medium text-blue-200">Session:</span>
              <div className="text-white font-semibold">2023/2024</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            href: "/dashboard/student/courses",
            icon: faBook,
            title: "Current Courses",
            value: courses.length,
            color: "blue",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            valueColor: "text-blue-600"
          },
          {
            href: "/dashboard/student/grades",
            icon: faChartBar,
            title: "Current GPA",
            value: calculateGPA(),
            color: "green",
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            valueColor: "text-green-600"
          },
          {
            href: "/dashboard/student/payments",
            icon: faCreditCard,
            title: "Pending Payments",
            value: pendingPayments,
            color: "orange",
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            valueColor: "text-orange-600"
          },
          {
            href: "/dashboard/student/schedule",
            icon: faCalendarAlt,
            title: "Today's Classes",
            value: 5,
            color: "purple",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            valueColor: "text-purple-600"
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href={stat.href} className={`block p-6 bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${stat.bgColor} group-hover:bg-opacity-50`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <FontAwesomeIcon icon={stat.icon} className={`${stat.iconColor} text-2xl`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600 text-sm">{stat.title}</h3>
                  <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Exams Section */}
      {upcomingExams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-lg border mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upcoming Exams</h2>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
              {upcomingExams.length} scheduled
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingExams.slice(0, 4).map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="border border-gray-200 rounded-xl p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">{exam.courseName}</h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                    {exam.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(exam.date).toLocaleDateString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Time:</span>
                    <span>{exam.time}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{exam.duration} minutes</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Venue:</span>
                    <span>{exam.venue}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <motion.a
                    href={generateExamLink(student.id, exam.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300"
                  >
                    <FontAwesomeIcon icon={faPlay} className="text-xs" />
                    Start Exam
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-300"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white p-6 rounded-2xl shadow-lg border"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Recent Announcements</h2>
        <div className="space-y-6">
          {[
            {
              title: "Midterm Exams Schedule Released",
              date: "2024-01-05",
              content: "The midterm examination schedule has been released. Please check your dashboard for exam dates and venues. All students are advised to prepare accordingly.",
              type: "important"
            },
            {
              title: "Science Laboratory Equipment Update",
              date: "2023-12-28",
              content: "New laboratory equipment has been installed in the chemistry and physics labs. Students will be oriented on the new equipment during their next lab sessions.",
              type: "info"
            }
          ].map((announcement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              className="border-l-4 border-red-400 pl-4 py-3 bg-gradient-to-r from-red-50 to-transparent rounded-r-lg hover:from-red-100 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {announcement.date}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{announcement.content}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}