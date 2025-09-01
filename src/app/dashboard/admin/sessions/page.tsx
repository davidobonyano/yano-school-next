'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, BookOpen, TrendingUp, Plus, Edit, Eye } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  session_name: string;
}

interface SessionStats {
  total_students: number;
  total_courses: number;
  total_fees: number;
  active_enrollments: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [message, setMessage] = useState('');

  // Show message function
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 5000);
  };

  // Fetch sessions and terms
  const fetchSessionsAndTerms = async () => {
    setIsLoading(true);
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
      }
    } catch (error) {
      console.error('Error fetching sessions and terms:', error);
      showMessage('Error fetching sessions and terms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch session statistics
  const fetchSessionStats = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setSessionStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
    }
  };

  // Activate session
  const activateSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/admin/sessions/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        showMessage('Session activated successfully');
        fetchSessionsAndTerms(); // Refresh the list
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to activate session', 'error');
      }
    } catch (error) {
      console.error('Error activating session:', error);
      showMessage('Error activating session', 'error');
    }
  };

  // Activate term
  const activateTerm = async (termId: string) => {
    try {
      const response = await fetch('/api/admin/terms/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ termId }),
      });

      if (response.ok) {
        showMessage('Term activated successfully');
        fetchSessionsAndTerms(); // Refresh the list
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to activate term', 'error');
      }
    } catch (error) {
      console.error('Error activating term:', error);
      showMessage('Error activating term', 'error');
    }
  };

  useEffect(() => {
    fetchSessionsAndTerms();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionStats(selectedSession);
    }
  }, [selectedSession]);

  // Filter terms for selected session
  const filteredTerms = terms.filter(term => 
    sessions.find(s => s.id === selectedSession)?.name === term.session_name
  );

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Academic Session Management
          </h1>
          <p className="text-gray-600">Manage academic sessions and terms from 2023-2030</p>
        </div>
        <Button onClick={fetchSessionsAndTerms} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Session and Term Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session">Select Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session" />
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
            <div>
              <Label htmlFor="term">Select Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a term" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} {term.is_active && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Statistics */}
      {sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.total_students}</div>
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
                  <div className="text-2xl font-bold text-green-600">{sessionStats.total_courses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">₦{sessionStats.total_fees?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Total Fees</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{sessionStats.active_enrollments}</div>
                  <div className="text-sm text-gray-600">Active Enrollments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Sessions (2023-2030)</CardTitle>
          <CardDescription>
            Manage academic sessions and view historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading sessions...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">No sessions found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{session.name}</h3>
                        {session.is_active && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {!session.is_active && (
                        <Button
                          size="sm"
                          onClick={() => activateSession(session.id)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Terms for this session */}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Terms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {terms
                        .filter(term => term.session_name === session.name)
                        .map(term => (
                          <div key={term.id} className="flex items-center gap-2 text-sm">
                            <Badge 
                              variant={term.is_active ? "default" : "secondary"}
                              className={term.is_active ? "bg-blue-100 text-blue-800" : ""}
                            >
                              {term.name}
                            </Badge>
                            {!term.is_active && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => activateTerm(term.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


