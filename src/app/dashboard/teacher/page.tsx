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
  AlertCircle,
  Users,
  Plus,
  BarChart3,
  Edit,
  Eye
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
  created_by: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  grade: string;
  section: string;
  email: string;
}

interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  max_score: number;
  time_taken: number;
  submitted_at: string;
  student_name: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
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

    if (profile?.role !== 'TEACHER') {
      router.push('/auth/login');
      return;
    }

    setUser(profile);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch teacher's exams
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (examsData) setExams(examsData);
      }

      // Mock students data (replace with actual data)
      const mockStudents: Student[] = [
        { id: '1', first_name: 'John', last_name: 'Doe', student_id: 'STU001', grade: 'Grade 10', section: 'A', email: 'john.doe@example.com' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', student_id: 'STU002', grade: 'Grade 10', section: 'A', email: 'jane.smith@example.com' },
        { id: '3', first_name: 'Mike', last_name: 'Johnson', student_id: 'STU003', grade: 'Grade 10', section: 'B', email: 'mike.johnson@example.com' },
        { id: '4', first_name: 'Sarah', last_name: 'Williams', student_id: 'STU004', grade: 'Grade 10', section: 'B', email: 'sarah.williams@example.com' },
      ];
      setStudents(mockStudents);

      // Mock exam results (replace with actual data)
      const mockExamResults: ExamResult[] = [
        { id: '1', exam_id: 'exam1', student_id: '1', score: 85, max_score: 100, time_taken: 45, submitted_at: '2024-01-15T10:30:00Z', student_name: 'John Doe' },
        { id: '2', exam_id: 'exam1', student_id: '2', score: 92, max_score: 100, time_taken: 50, submitted_at: '2024-01-15T10:35:00Z', student_name: 'Jane Smith' },
        { id: '3', exam_id: 'exam1', student_id: '3', score: 78, max_score: 100, time_taken: 40, submitted_at: '2024-01-15T10:25:00Z', student_name: 'Mike Johnson' },
      ];
      setExamResults(mockExamResults);

      // Mock announcements (replace with actual data)
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Staff Meeting Tomorrow',
          content: 'Important staff meeting tomorrow at 3 PM in the conference room.',
          created_at: '2024-01-15T10:00:00Z',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Grade Submission Deadline',
          content: 'Please submit all grades by Friday for the midterm period.',
          created_at: '2024-01-14T14:30:00Z',
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Professional Development Workshop',
          content: 'New teaching methodologies workshop next week.',
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

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
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
              <h1 className="text-xl font-bold text-gray-900">Yano School - Teacher Dashboard</h1>
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
            Manage your classes, exams, and student progress from your dashboard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-6 h-6" />
                  <span>Create New Exam</span>
                </Button>
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700">
                  <Users className="w-6 h-6" />
                  <span>Manage Students</span>
                </Button>
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Analytics</span>
                </Button>
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-orange-600 hover:bg-orange-700">
                  <Bell className="w-6 h-6" />
                  <span>Send Announcement</span>
                </Button>
              </div>
            </motion.div>

            {/* Recent Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Exams
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
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No exams created yet.</p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Create Your First Exam
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Recent Exam Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Recent Exam Results
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {examResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{result.student_name}</h4>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(result.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(result.score, result.max_score)}`}>
                        {result.score}/{result.max_score}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round((result.score / result.max_score) * 100)}%
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
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Students</span>
                  <span className="font-semibold text-blue-600">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Exams</span>
                  <span className="font-semibold text-green-600">{exams.filter(e => e.is_active).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold text-purple-600">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Reviews</span>
                  <span className="font-semibold text-orange-600">5</span>
                </div>
              </div>
            </motion.div>

            {/* My Students */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  My Students
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-500">{student.grade} - {student.section}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{student.student_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
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
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Today's Classes
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Mathematics</p>
                    <p className="text-sm text-gray-600">Grade 10A - Room 201</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">8:00 AM</p>
                    <p className="text-xs text-gray-500">45 min</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Physics</p>
                    <p className="text-sm text-gray-600">Grade 10B - Lab 105</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">10:30 AM</p>
                    <p className="text-xs text-gray-500">60 min</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Mathematics</p>
                    <p className="text-sm text-gray-600">Grade 11A - Room 201</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">2:00 PM</p>
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