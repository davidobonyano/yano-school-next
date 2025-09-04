"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getStudentSession } from "@/lib/student-session";
import { useGlobalAcademicContext } from "@/contexts/GlobalAcademicContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBook,
  faChartBar,
  faCreditCard,
  faCalendarAlt,
  faExternalLinkAlt,
  faPlay,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

export default function StudentDashboard() {
  const { academicContext } = useGlobalAcademicContext();
  const [isClient, setIsClient] = useState(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentStream, setStudentStream] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionCgpa, setCurrentSessionCgpa] = useState<string>('0.00');
  
  type Announcement = {
    id: string;
    title: string;
    body: string;
    audience: 'students'|'teachers'|'admins'|'all'|'class'|'role';
    created_at: string;
    expires_at: string | null;
    audience_class_level?: string | null;
    audience_stream?: string | null;
    audience_role?: 'student'|'teacher'|'admin' | null;
  };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Format class level for display
  const formatClassLevel = (classLevel: string | null | undefined): string => {
    if (!classLevel) return '';
    
    // Handle enum values like JSS1, SS1, PRI1, etc.
    if (classLevel.startsWith('JSS')) {
      return `JSS ${classLevel.slice(3)}`;
    }
    if (classLevel.startsWith('SS')) {
      return `SS ${classLevel.slice(2)}`;
    }
    if (classLevel.startsWith('PRI')) {
      return `Primary ${classLevel.slice(3)}`;
    }
    if (classLevel.startsWith('KG')) {
      return `KG ${classLevel.slice(2)}`;
    }
    
    return classLevel; // Return as-is for any other format
  };

  const formattedClass = formatClassLevel(studentClass);
  const isSenior = studentClass ? studentClass.toUpperCase().startsWith('SS') : false;
  // Use stream from session if available
  const stream = studentStream;



  useEffect(() => {
    setIsClient(true);
    const s = getStudentSession();
    if (s) {
      setStudentName(s.full_name);
      setStudentId(s.student_id);
      setStudentClass(s.class_level || '');
      setStudentStream(s.stream || '');
      setIsActive(typeof s.is_active === 'boolean' ? s.is_active : true);
    }
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with real student courses/grades endpoints once available
      setCourses([]);
      setGrades([]);
      setPayments([]);
      setUpcomingExams([]);
      
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved registrations for current term/session and set as current courses
  useEffect(() => {
    const fetchApprovedCourses = async () => {
      if (!studentId || !academicContext?.term || !academicContext?.session) return;
      try {
        const params = new URLSearchParams();
        params.append('student_id', studentId);
        params.append('term', academicContext.term);
        params.append('session', academicContext.session);
        params.append('status', 'approved');
        params.append('limit', '200');
        const res = await fetch(`/api/courses/registrations?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) {
          setCourses([]);
          return;
        }
        const data = await res.json();
        const regs = Array.isArray(data.registrations) ? data.registrations : [];
        setCourses(regs);
      } catch (e) {
        console.error('Failed to fetch approved courses', e);
        setCourses([]);
      }
    };
    fetchApprovedCourses();
  }, [studentId, academicContext?.term, academicContext?.session]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/announcements', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        const now = Date.now();
        const classMatch = (a: Announcement): boolean => {
          const cls = (studentClass || '').toUpperCase().replace(/\s+/g, '');
          const target = (a.audience_class_level || '').toUpperCase();
          return !!target && cls.includes(target);
        };
        const list: Announcement[] = (data.announcements || [])
          .filter((a: Announcement) => {
            const notExpired = !a.expires_at || new Date(a.expires_at).getTime() > now;
            const forStudents = a.audience === 'all' || a.audience === 'students' || (a.audience === 'role' && a.audience_role === 'student') || (a.audience === 'class' && classMatch(a));
            return notExpired && forStudents;
          })
          .slice(0, 5);
        setAnnouncements(list);
      } catch {}
    })();
  }, []);

  const calculateGPA = () => {
    if (grades.length === 0) return "0.00";
    const total = grades.reduce((sum: number, grade: any) => sum + grade.total, 0);
    return ((total / grades.length / 100) * 4).toFixed(1);
  };

  // Safe date formatting to prevent hydration mismatch
  const formatDate = (dateString: string) => {
    if (!isClient) return dateString; // Return raw string on server
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const pendingPayments = payments.filter(
    (p: any) => p.status === "Pending" || p.status === "Partial"
  ).length;

  // Compute CGPA for current session
  useEffect(() => {
    const computeSessionCgpa = async () => {
      const s = getStudentSession();
      const sessionName = academicContext.session;
      if (!s?.student_id || !sessionName) {
        setCurrentSessionCgpa('0.00');
        return;
      }
      try {
        const terms = ['First Term', 'Second Term', 'Third Term'];
        const requests = terms.map(t =>
          fetch(`/api/results?student_id=${encodeURIComponent(s.student_id)}&session=${encodeURIComponent(sessionName)}&term=${encodeURIComponent(t)}`)
            .then(r => (r.ok ? r.json() : { results: [] }))
            .catch(() => ({ results: [] }))
        );
        const responses = await Promise.all(requests);
        const points: number[] = [];
        const toPoint = (grade: string): number => {
          if (!grade) return 0;
          if (grade.startsWith('A')) return 5.0;
          if (grade === 'B2') return 4.5;
          if (grade === 'B3') return 4.0;
          if (grade === 'C4') return 3.5;
          if (grade === 'C5') return 3.0;
          if (grade === 'C6') return 2.5;
          if (grade === 'D7') return 2.0;
          if (grade === 'E8') return 1.0;
          return 0.0;
        };
        responses.forEach(r => {
          const rows = (r?.results || []) as Array<{ grade: string }>;
          rows.forEach(row => points.push(toPoint(row.grade)));
        });
        if (points.length === 0) {
          setCurrentSessionCgpa('0.00');
          return;
        }
        const cg = points.reduce((a, b) => a + b, 0) / points.length;
        setCurrentSessionCgpa(cg.toFixed(2));
      } catch {
        setCurrentSessionCgpa('0.00');
      }
    };
    computeSessionCgpa();
  }, [academicContext.session, studentId]);

  // Helper functions for term information
  const getNextTerm = (currentTerm: string): string => {
    switch (currentTerm) {
      case '1st Term':
        return '2nd Term';
      case '2nd Term':
        return '3rd Term';
      case '3rd Term':
        return 'New Session';
      default:
        return '1st Term';
    }
  };

  const getSessionProgress = (currentTerm: string): number => {
    switch (currentTerm) {
      case '1st Term':
        return 33;
      case '2nd Term':
        return 67;
      case '3rd Term':
        return 100;
      default:
        return 0;
    }
  };

  const getTermStatus = (currentTerm: string): string => {
    switch (currentTerm) {
      case '1st Term':
        return 'Active';
      case '2nd Term':
        return 'Active';
      case '3rd Term':
        return 'Final';
      default:
        return 'Unknown';
    }
  };

  const hasStudent = Boolean(studentId);
  // Prevent hydration mismatch by showing loading state until client renders
  if (!isClient || loading || !hasStudent) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
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
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span>Welcome, {studentName || studentId}!</span>
              {!isActive && (
                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-yellow-200 text-yellow-900 border border-yellow-300">
                  Graduated
                </span>
              )}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div>
                <span className="font-medium text-blue-200">Student ID:</span>
                <div className="text-white font-semibold">{studentId}</div>
              </div>
              <div>
                <span className="font-medium text-blue-200">Class:</span>
                <div className="text-white font-semibold">
                  {!isActive ? 'Graduated' : (formattedClass || 'Not Assigned')}
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-200">Status:</span>
                <div className="text-white font-semibold">{isActive ? 'Active' : 'Graduated'}</div>
              </div>
              {(isSenior || !!stream) && (
                <div>
                  <span className="font-medium text-blue-200">Stream:</span>
                  <div className="text-white font-semibold">{stream || '-'}</div>
                </div>
              )}
              <div>
                <span className="font-medium text-blue-200">Session:</span>
                <div className="text-white font-semibold">{academicContext.session || '2025/2026'}</div>
              </div>
              <div>
                <span className="font-medium text-blue-200">Term:</span>
                <div className="text-white font-semibold">{academicContext.term || '1st Term'}</div>
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
              title: "Current Courses (Approved)",
              value: courses.length,
              color: "blue",
              bgColor: "bg-blue-50",
              iconColor: "text-blue-600",
              valueColor: "text-blue-600",
            },
            {
              href: "/dashboard/student/grades",
              icon: faChartBar,
              title: "Current CGPA",
              value: currentSessionCgpa,
              color: "green",
              bgColor: "bg-green-50",
              iconColor: "text-green-600",
              valueColor: "text-green-600",
            },
            {
              href: "/dashboard/student/payments",
              icon: faCreditCard,
              title: "Pending Payments",
              value: pendingPayments,
              color: "orange",
              bgColor: "bg-orange-50",
              iconColor: "text-orange-600",
              valueColor: "text-orange-600",
            },
            {
              href: "/dashboard/student/schedule",
              icon: faCalendarAlt,
              title: "Today's Classes",
              value: courses.length > 0 ? Math.min(courses.length, 5) : 0,
              color: "purple",
              bgColor: "bg-purple-50",
              iconColor: "text-purple-600",
              valueColor: "text-purple-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Link
                href={stat.href}
                className={`block p-6 bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${stat.bgColor} group-hover:bg-opacity-50`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <FontAwesomeIcon
                      icon={stat.icon}
                      className={`${stat.iconColor} text-2xl`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600 text-sm">
                      {stat.title}
                    </h3>
                    <p className={`text-3xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Exams Section */}
        {upcomingExams.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white p-6 rounded-2xl shadow-lg border mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Upcoming Exams
              </h2>
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                {upcomingExams.length} scheduled
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingExams.slice(0, 4).map((exam: any, index: number) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {exam.courseName || exam.name || 'Unknown Course'}
                    </h3>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                      {exam.status || 'Upcoming'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2 mb-4">
                    <p className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(exam.date || exam.exam_date)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Time:</span>
                      <span>{exam.time || 'TBA'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Duration:</span>
                      <span>{exam.duration || 'TBA'} minutes</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Venue:</span>
                      <span>{exam.venue || 'TBA'}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <motion.a
                      href="https://yano-exams-o6re.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300"
                    >
                      <FontAwesomeIcon icon={faPlay} className="text-xs" />
                      Go to Exam Portal
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white p-6 rounded-2xl shadow-lg border mb-8"
          >
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Upcoming Exams</h2>
              <p className="text-gray-600 mb-6">You don't have any exams scheduled at the moment.</p>
              <motion.a
                href="https://yano-exams-o6re.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4" />
                Visit Exam Portal
              </motion.a>
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
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Recent Announcements
          </h2>
          <div className="space-y-6">
            {announcements.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="border-l-4 border-blue-400 pl-4 py-3 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg hover:from-blue-100 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">
                    {a.title}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {formatDate(a.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {a.body}
                </p>
              </motion.div>
            ))}
            {announcements.length === 0 && (
              <div className="text-gray-500">No announcements yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

