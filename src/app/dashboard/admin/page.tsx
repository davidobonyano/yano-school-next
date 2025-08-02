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
  Eye,
  Shield,
  Settings,
  Activity,
  Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface SystemStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  activeExams: number;
  totalUsers: number;
  systemUptime: string;
}

interface RecentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  status: 'active' | 'pending' | 'suspended';
}

interface SystemLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  target_audience: 'all' | 'students' | 'teachers' | 'admins';
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    activeExams: 0,
    totalUsers: 0,
    systemUptime: '99.9%'
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
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

    if (profile?.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    setUser(profile);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch system statistics
      const { data: students } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'STUDENT');

      const { data: teachers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'TEACHER');

      const { data: exams } = await supabase
        .from('exams')
        .select('id, is_active');

      const { data: allUsers } = await supabase
        .from('users')
        .select('id');

      setSystemStats({
        totalStudents: students?.length || 0,
        totalTeachers: teachers?.length || 0,
        totalExams: exams?.length || 0,
        activeExams: exams?.filter(e => e.is_active).length || 0,
        totalUsers: allUsers?.length || 0,
        systemUptime: '99.9%'
      });

      // Mock recent users (replace with actual data)
      const mockRecentUsers: RecentUser[] = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', role: 'STUDENT', created_at: '2024-01-15T10:00:00Z', status: 'active' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', role: 'TEACHER', created_at: '2024-01-14T14:30:00Z', status: 'active' },
        { id: '3', first_name: 'Mike', last_name: 'Johnson', email: 'mike.johnson@example.com', role: 'STUDENT', created_at: '2024-01-13T09:15:00Z', status: 'pending' },
        { id: '4', first_name: 'Sarah', last_name: 'Williams', email: 'sarah.williams@example.com', role: 'TEACHER', created_at: '2024-01-12T16:45:00Z', status: 'active' },
      ];
      setRecentUsers(mockRecentUsers);

      // Mock system logs (replace with actual data)
      const mockSystemLogs: SystemLog[] = [
        { id: '1', action: 'User Login', user: 'john.doe@example.com', timestamp: '2024-01-15T10:30:00Z', details: 'Successful login from IP 192.168.1.100', severity: 'info' },
        { id: '2', action: 'Exam Created', user: 'jane.smith@example.com', timestamp: '2024-01-15T09:15:00Z', details: 'New exam "Mathematics Midterm" created', severity: 'info' },
        { id: '3', action: 'System Warning', user: 'system', timestamp: '2024-01-15T08:45:00Z', details: 'High memory usage detected', severity: 'warning' },
        { id: '4', action: 'User Registration', user: 'mike.johnson@example.com', timestamp: '2024-01-15T08:00:00Z', details: 'New student account registered', severity: 'info' },
      ];
      setSystemLogs(mockSystemLogs);

      // Mock announcements (replace with actual data)
      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'System Maintenance',
          content: 'Scheduled maintenance on Sunday from 2 AM to 4 AM.',
          created_at: '2024-01-15T10:00:00Z',
          priority: 'high',
          target_audience: 'all'
        },
        {
          id: '2',
          title: 'New Features Available',
          content: 'Advanced analytics and reporting features are now available.',
          created_at: '2024-01-14T14:30:00Z',
          priority: 'medium',
          target_audience: 'teachers'
        },
        {
          id: '3',
          title: 'Security Update',
          content: 'Latest security patches have been applied to the system.',
          created_at: '2024-01-13T09:15:00Z',
          priority: 'low',
          target_audience: 'admins'
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'suspended':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">Yano School - Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user?.first_name} {user?.last_name} (Admin)
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
            Monitor and manage the entire school system from your admin dashboard.
          </p>
        </motion.div>

        {/* System Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.totalTeachers}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-purple-600">{systemStats.activeExams}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700">
                  <Users className="w-6 h-6" />
                  <span>Manage Users</span>
                </Button>
                <Button className="h-16 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700">
                  <Database className="w-6 h-6" />
                  <span>System Settings</span>
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

            {/* Recent Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Users
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{user.first_name} {user.last_name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  System Logs
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {systemLogs.map((log) => (
                  <div key={log.id} className={`p-4 border rounded-lg ${getSeverityColor(log.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{log.action}</h4>
                        <p className="text-sm opacity-80">{log.details}</p>
                        <p className="text-xs opacity-60 mt-2">
                          User: {log.user} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">CPU Usage</span>
                  <span className="font-semibold text-green-600">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className="font-semibold text-yellow-600">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Disk Space</span>
                  <span className="font-semibold text-green-600">62%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Network</span>
                  <span className="font-semibold text-green-600">Stable</span>
                </div>
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
                  System Announcements
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
                          {new Date(announcement.created_at).toLocaleDateString()} • {announcement.target_audience}
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

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-semibold text-blue-600">{systemStats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Exams</span>
                  <span className="font-semibold text-green-600">{systemStats.totalExams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Approvals</span>
                  <span className="font-semibold text-orange-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">System Alerts</span>
                  <span className="font-semibold text-red-600">1</span>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New user registered</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Exam completed</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">System backup</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
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