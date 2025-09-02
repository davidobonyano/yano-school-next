'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, DollarSign, BookOpen, FlaskConical } from 'lucide-react';

interface FeeStructure {
  id: string;
  class_level: string;
  stream?: string;
  fee_type: string;
  amount: number;
  description: string;
  session_name?: string;
  term_name?: string;
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
}

interface FeeStructureManagerProps {
  className?: string;
}

export function FeeStructureManager({ className = '' }: FeeStructureManagerProps) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const classes = ['KG1', 'KG2', 'PRI1', 'PRI2', 'PRI3', 'PRI4', 'PRI5', 'PRI6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

  // Fetch sessions and terms
  const fetchSessionsAndTerms = async () => {
    setIsLoadingSessions(true);
    try {
      // Fetch sessions
      const sessionsResponse = await fetch('/api/academic/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
        
        // Set default session to current active session
        const activeSession = sessionsData.sessions?.find((s: Session) => s.is_active);
        if (activeSession) {
          setSelectedSession(activeSession.name);
        }
      }

      // Fetch terms
      const termsResponse = await fetch('/api/academic/terms');
      if (termsResponse.ok) {
        const termsData = await termsResponse.json();
        setTerms(termsData.terms || []);
        
        // Set default term to current active term
        const activeTerm = termsData.terms?.find((t: Term) => t.is_active);
        if (activeTerm) {
          setSelectedTerm(activeTerm.name);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions and terms:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession !== 'all') params.append('session', selectedSession);
      if (selectedTerm !== 'all') params.append('term', selectedTerm);
      if (selectedClass !== 'all') params.append('class_level', selectedClass);
      if (searchTerm) params.append('search', searchTerm);

      console.log('Fetching fee structures with params:', params.toString());
      const response = await fetch(`/api/fee-structures?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fee structures response:', data);
        setFeeStructures(data.feeStructures || []);
      } else {
        console.error('Failed to fetch fee structures:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsAndTerms();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && terms.length > 0) {
      fetchFeeStructures();
    }
  }, [selectedSession, selectedTerm, selectedClass, searchTerm, sessions.length, terms.length]);

  // Get fee type icon
  const getFeeTypeIcon = (feeType: string) => {
    switch (feeType) {
      case 'tuition': return <DollarSign className="h-4 w-4" />;
      case 'library': return <BookOpen className="h-4 w-4" />;
      case 'laboratory': return <FlaskConical className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // Get fee type color
  const getFeeTypeColor = (feeType: string) => {
    switch (feeType) {
      case 'tuition': return 'bg-blue-100 text-blue-800';
      case 'library': return 'bg-green-100 text-green-800';
      case 'laboratory': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group fee structures by class
  const groupedFees = feeStructures.reduce((acc, fee) => {
    const key = `${fee.class_level}${fee.stream ? `-${fee.stream}` : ''}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, FeeStructure[]>);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Structure Management</CardTitle>
              <CardDescription>
                View and manage fee structures for all classes and terms
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fee Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession} disabled={isLoadingSessions}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSessions ? "Loading..." : "Select Session"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.name}>
                      {session.name} {session.is_active && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={isLoadingSessions}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSessions ? "Loading..." : "Select Term"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.name}>
                      {term.name} {term.is_active && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={fetchFeeStructures} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <div>Selected Session: {selectedSession}</div>
            <div>Selected Term: {selectedTerm}</div>
            <div>Selected Class: {selectedClass}</div>
            <div>Fee Structures Found: {feeStructures.length}</div>
            <div>Total Sessions: {sessions.length}</div>
            <div>Total Terms: {terms.length}</div>
          </div>

          {/* Fee Structures Display */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading fee structures...</div>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">No fee structures found</div>
              <div className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or check if fee structures exist for the selected session/term.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFees).map(([classKey, fees]) => (
                <div key={classKey} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">{classKey}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fees.map((fee) => (
                      <div key={fee.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getFeeTypeColor(fee.fee_type)}>
                            {getFeeTypeIcon(fee.fee_type)}
                            <span className="ml-1">{fee.fee_type}</span>
                          </Badge>
                          <span className="text-lg font-semibold">₦{fee.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{fee.description}</p>
                        <div className="text-xs text-gray-500">
                          <div>Session: {fee.session_name || 'N/A'}</div>
                          <div>Term: {fee.term_name || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
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
