'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';

interface GlobalAcademicSwitcherProps {
  className?: string;
}

export function GlobalAcademicSwitcher({ className = '' }: GlobalAcademicSwitcherProps) {
  const { academicContext, updateSession, updateTerm, isLoading } = useGlobalAcademicContext();
  const [sessions, setSessions] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch available sessions and terms
  useEffect(() => {
    fetchSessionsAndTerms();
  }, []);

  const fetchSessionsAndTerms = async () => {
    try {
      const [sessionsRes, termsRes] = await Promise.all([
        fetch('/api/settings/academic-context/sessions'),
        fetch('/api/settings/academic-context/terms')
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions?.map((s: any) => s.name) || []);
      }

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        setTerms(termsData.terms?.map((t: any) => t.name) || []);
      }
    } catch (error) {
      console.error('Error fetching sessions and terms:', error);
    }
  };

  const handleSessionChange = async (session: string) => {
    if (session === academicContext.session) return;
    
    setIsUpdating(true);
    try {
      await updateSession(session);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTermChange = async (term: string) => {
    if (term === academicContext.term) return;
    
    setIsUpdating(true);
    try {
      await updateTerm(term);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = () => {
    // Force refresh all dashboard pages
    window.dispatchEvent(new CustomEvent('forcePageRefresh'));
    
    // Also trigger a router refresh
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/dashboard/')) {
        window.dispatchEvent(new CustomEvent('dashboardContextChanged', {
          detail: { 
            session: academicContext.session, 
            term: academicContext.term,
            sessionId: academicContext.sessionId,
            termId: academicContext.termId
          }
        }));
      }
    }
    
    // Finally, reload the page if needed
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Academic Context</CardTitle>
              <CardDescription>
                Global session and term settings
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Context Display */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Current Session:</span>
              <Badge variant="default" className="bg-blue-600">
                {academicContext.session}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Current Term:</span>
              <Badge variant="default" className="bg-green-600">
                {academicContext.term}
              </Badge>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>

        {/* Session and Term Switchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Change Session</Label>
            <Select
              value={academicContext.session}
              onValueChange={handleSessionChange}
              disabled={isLoading || isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session} value={session}>
                    {session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Change Term</Label>
            <Select
              value={academicContext.term}
              onValueChange={handleTermChange}
              disabled={isLoading || isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map(term => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Message */}
        {isUpdating && (
          <div className="flex items-center justify-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                Updating academic context... This will refresh all data across the system.
              </span>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Changing the academic context will affect all data across the system including 
            payments, courses, and student records. The change will be applied globally to all dashboards.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Import Label component
import { Label } from '@/components/ui/label';










