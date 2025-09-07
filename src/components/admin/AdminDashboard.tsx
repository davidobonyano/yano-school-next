'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, TrendingUp, DollarSign, RefreshCw, Calendar, Clock } from 'lucide-react';

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  active_courses: number;
  total_revenue: number;
  completed_payments: number;
  active_students: number;
  active_courses_count: number;
}

interface Session {
  id: string;
  name: string;
  is_active: boolean;
}

interface Term {
  id: string;
  name: string;
  is_active: boolean;
  academic_sessions: {
    name: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Show message function
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 5000);
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession) params.set('sessionId', selectedSession);
      if (selectedTerm) params.set('termId', selectedTerm);
      const url = `/api/admin/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        showMessage('Failed to fetch dashboard statistics', 'error');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showMessage('Error fetching dashboard statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions and terms
  const fetchSessionsAndTerms = async () => {
    try {
      // Fetch sessions
      const sessionsResponse = await fetch('/api/academic/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
        
        // Set default to current active session
        const activeSession = sessionsData.sessions?.find((s: Session) => s.is_active);
        if (activeSession) {
          setSelectedSession(activeSession.id);
        }
      }

      // Fetch terms
      const termsResponse = await fetch('/api/academic/terms');
      if (termsResponse.ok) {
        const termsData = await termsResponse.json();
        setTerms(termsData.terms || []);
        
        // Set default to current active term
        const activeTerm = termsData.terms?.find((t: Term) => t.is_active);
        if (activeTerm) {
          setSelectedTerm(activeTerm.id);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions and terms:', error);
      showMessage('Error fetching sessions and terms', 'error');
    }
  };

  // Change session
  const changeSession = async (sessionId: string) => {
    try {
      // Reset revenue immediately on context change request
      setStats(prev => prev ? { ...prev, total_revenue: 0 } : prev);
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate_session',
          session_id: sessionId
        }),
      });

      if (response.ok) {
        showMessage('Session changed successfully');
        // Refresh data
        fetchDashboardStats();
        fetchSessionsAndTerms();
        
        // Trigger global context refresh
        window.dispatchEvent(new CustomEvent('academicContextChanged'));
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to change session', 'error');
      }
    } catch (error) {
      console.error('Error changing session:', error);
      showMessage('Error changing session', 'error');
    }
  };

  // Change term
  const changeTerm = async (termId: string) => {
    try {
      // Reset revenue immediately on context change request
      setStats(prev => prev ? { ...prev, total_revenue: 0 } : prev);
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate_term',
          term_id: termId
        }),
      });

      if (response.ok) {
        showMessage('Term changed successfully');
        // Refresh data
        fetchDashboardStats();
        fetchSessionsAndTerms();
        
        // Trigger global context refresh
        window.dispatchEvent(new CustomEvent('academicContextChanged'));
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to change term', 'error');
      }
    } catch (error) {
      console.error('Error changing term:', error);
      showMessage('Error changing term', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchSessionsAndTerms();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (selectedSession || selectedTerm) {
      fetchDashboardStats();
    }
  }, [selectedSession, selectedTerm]);

  // Filter terms for selected session
  const filteredTerms = terms.filter(term => {
    const selectedSessionObj = sessions.find(s => s.id === selectedSession);
    return selectedSessionObj && term.academic_sessions.name === selectedSessionObj.name;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('error') || message.includes('Failed') || message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Global session and term settings</p>
        </div>
        <Button onClick={fetchDashboardStats} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Global Session and Term Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Session and Term Settings</CardTitle>
          <CardDescription>
            Note: Changing the academic context will affect all data across the system including payments, courses, and student records. The change will be applied globally to all dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Information */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Sessions loaded:</span> {sessions.length}
                {sessions.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Available: {sessions.map(s => s.name).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <span className="font-medium">Terms loaded:</span> {terms.length}
                                 {terms.length > 0 && (
                   <div className="text-xs text-gray-600 mt-1">
                     Available: {terms.map(t => `${t.name} (${t.academic_sessions.name})`).join(', ')}
                   </div>
                 )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Current Session:</label>
              <div className="mt-1">
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} {session.is_active && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => changeSession(selectedSession)}
                disabled={!selectedSession || sessions.find(s => s.id === selectedSession)?.is_active}
                className="mt-2"
                size="sm"
              >
                Change Session
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Current Term:</label>
              <div className="mt-1">
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTerms.length > 0 ? (
                      filteredTerms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name} {term.is_active && '(Current)'}
                        </SelectItem>
                      ))
                                         ) : (
                       <div className="px-2 py-1.5 text-sm text-gray-500">
                         {selectedSession ? 'No terms for selected session' : 'Select a session first'}
                       </div>
                     )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => changeTerm(selectedTerm)}
                disabled={!selectedTerm || terms.find(t => t.id === selectedTerm)?.is_active}
                className="mt-2"
                size="sm"
              >
                Change Term
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats?.total_students || 0}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.total_teachers || 0}</div>
                <div className="text-sm text-gray-600">Total Teachers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats?.active_courses || 0}</div>
                <div className="text-sm text-gray-600">Active Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">₦{stats?.total_revenue?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600">Revenue (₦)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              Add New Student
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center">
              <BookOpen className="w-6 h-6 mb-2" />
              Add New Teacher
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center">
              <Calendar className="w-6 h-6 mb-2" />
              Post Announcement
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center">
              <DollarSign className="w-6 h-6 mb-2" />
              Pending Payments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.completed_payments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.active_students || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.active_courses_count || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


