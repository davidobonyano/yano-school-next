'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  TrendingUp, 
  Bell, 
  User, 
  LogOut,
  FileText,
  Award,
  Clock3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Grade {
  subject: string;
  grade: string;
  percentage: number;
  last_updated: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchDashboardData();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'STUDENT') {
      router.push('/auth/login');
      return;
    }

    setUser(profile);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch active exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (examsData) setExams(examsData);

      // Mock grades data (replace with actual data)
      const mockGrades: Grade[] = [
        { subject: 'Mathematics', grade: 'A', percentage: 92, last_updated: '2024-01-15' },
        { subject: 'Physics', grade: 'A-', percentage: 88, last_updated: '2024-01-14' },
        { subject: 'English', grade: 'B+', percentage: 85, last_updated: '2024-01-13' },
        { subject: 'Chemistry', grade: 'A', percentage: 90, last_updated: '2024-01-12' },
      ];
      setGrades(mockGrades);

      // Mock announcements (replace with actual data)
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Midterm Exams Schedule',
          content: 'Midterm exams will begin next week. Please check your schedule.',
          created_at: '2024-01-15T10:00:00Z',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Science Fair Registration',
          content: 'Registration for the annual science fair is now open.',
          created_at: '2024-01-14T14:30:00Z',
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Library Hours Extended',
          content: 'Library hours have been extended for exam preparation.',
          created_at: '2024-01-13T09:15:00Z',
          priority: 'low'
        }
      ];
      setAnnouncements(mockAnnouncements);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Yano School - Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening in your academic journey today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Upcoming Exams
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              {exams.length > 0 ? (
                <div className="space-y-4">
                  {exams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">{exam.subject}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock3 className="w-4 h-4 mr-1" />
                            {exam.duration} min
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(exam.start_time).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Total Marks: {exam.total_marks}
                        </span>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Start Exam
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming exams at the moment.</p>
                </div>
              )}
            </motion.div>

            {/* Recent Grades */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Recent Grades
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                      <p className="text-sm text-gray-500">
                        Updated: {new Date(grade.last_updated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getGradeColor(grade.percentage)}`}>
                        {grade.grade}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grade.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Grade</span>
                  <span className="font-semibold text-green-600">A-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Exams Completed</span>
                  <span className="font-semibold text-blue-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Attendance</span>
                  <span className="font-semibold text-green-600">95%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Assignments Due</span>
                  <span className="font-semibold text-orange-600">3</span>
                </div>
              </div>
            </motion.div>

            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-orange-600" />
                  Announcements
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 border rounded-lg ${getPriorityColor(announcement.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{announcement.title}</h4>
                        <p className="text-sm opacity-80">{announcement.content}</p>
                        <p className="text-xs opacity-60 mt-2">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {announcement.priority === 'high' && (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Today's Schedule
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Mathematics</p>
                    <p className="text-sm text-gray-600">Room 201</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">8:00 AM</p>
                    <p className="text-xs text-gray-500">45 min</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Physics</p>
                    <p className="text-sm text-gray-600">Lab 105</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">9:00 AM</p>
                    <p className="text-xs text-gray-500">60 min</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">English</p>
                    <p className="text-sm text-gray-600">Room 305</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">10:30 AM</p>
                    <p className="text-xs text-gray-500">45 min</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}