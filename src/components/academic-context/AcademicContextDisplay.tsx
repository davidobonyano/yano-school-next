'use client';

import { useAcademicContext } from '@/lib/academic-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, BookOpen, Clock } from 'lucide-react';

interface AcademicContextDisplayProps {
  showControls?: boolean;
  className?: string;
}

export function AcademicContextDisplay({ showControls = false, className = '' }: AcademicContextDisplayProps) {
  const { 
    currentContext, 
    sessions, 
    terms, 
    isLoading, 
    error,
    activateSession,
    activateTerm 
  } = useAcademicContext();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading academic context...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentContext) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No academic context available</div>
        </CardContent>
      </Card>
    );
  }

  const handleSessionChange = async (sessionId: string) => {
    try {
      await activateSession(sessionId);
    } catch (error) {
      console.error('Failed to activate session:', error);
    }
  };

  const handleTermChange = async (termId: string) => {
    try {
      await activateTerm(termId);
    } catch (error) {
      console.error('Failed to activate term:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Current Academic Context
        </CardTitle>
        <CardDescription>
          Manage the active academic session and term
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Context Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Current Session</label>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {currentContext.session_name}
              </Badge>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              {new Date(currentContext.session_start).toLocaleDateString()} - {new Date(currentContext.session_end).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Current Term</label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {currentContext.term_name}
              </Badge>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              {new Date(currentContext.term_start).toLocaleDateString()} - {new Date(currentContext.term_end).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Controls for changing context */}
        {showControls && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Change Session</label>
                <Select
                  value={currentContext.session_id}
                  onValueChange={handleSessionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center gap-2">
                          {session.name}
                          {session.is_active && (
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Change Term</label>
                <Select
                  value={currentContext.term_id}
                  onValueChange={handleTermChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        <div className="flex items-center gap-2">
                          {term.name}
                          {term.is_active && (
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>💡 Changing the active session or term will update the current academic context across the system.</p>
              <p>This affects course displays, registrations, and other academic activities.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}









