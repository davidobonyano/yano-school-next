'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AcademicSession {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface AcademicTerm {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CurrentAcademicContext {
  session_id: string;
  session_name: string;
  term_id: string;
  term_name: string;
  session_start: string;
  session_end: string;
  term_start: string;
  term_end: string;
}

interface AcademicContextType {
  currentContext: CurrentAcademicContext | null;
  sessions: AcademicSession[];
  terms: AcademicTerm[];
  isLoading: boolean;
  error: string | null;
  refreshContext: () => Promise<void>;
  activateSession: (sessionId: string) => Promise<void>;
  activateTerm: (termId: string) => Promise<void>;
  createSession: (sessionData: { name: string; start_date: string; end_date: string }) => Promise<void>;
  createTerm: (termData: { session_id: string; name: string; start_date: string; end_date: string }) => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export function useAcademicContext() {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademicContext must be used within an AcademicContextProvider');
  }
  return context;
}

interface AcademicContextProviderProps {
  children: ReactNode;
}

export function AcademicContextProvider({ children }: AcademicContextProviderProps) {
  const [currentContext, setCurrentContext] = useState<CurrentAcademicContext | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current academic context
  const fetchCurrentContext = async () => {
    try {
      const response = await fetch('/api/settings/academic-context?action=current');
      if (response.ok) {
        const data = await response.json();
        setCurrentContext(data.current);
      } else {
        console.error('Failed to fetch current context');
      }
    } catch (error) {
      console.error('Error fetching current context:', error);
    }
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/settings/academic-context?action=sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Fetch terms for current session
  const fetchTerms = async () => {
    if (!currentContext?.session_id) return;
    
    try {
      const response = await fetch(`/api/settings/academic-context?action=terms&session_id=${currentContext.session_id}`);
      if (response.ok) {
        const data = await response.json();
        setTerms(data.terms);
      } else {
        console.error('Failed to fetch terms');
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  // Refresh all context data
  const refreshContext = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchCurrentContext(),
        fetchSessions()
      ]);
    } catch (error) {
      setError('Failed to refresh academic context');
      console.error('Error refreshing context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Activate a session
  const activateSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate_session',
          session_id: sessionId
        })
      });

      if (response.ok) {
        await refreshContext();
        
        // Auto-create payment records for the new session
        const newContext = await fetch('/api/settings/academic-context?action=current');
        if (newContext.ok) {
          const data = await newContext.json();
          if (data.current) {
            await fetch('/api/payments/auto-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
              body: JSON.stringify({
                sessionId: data.current.session_id,
                termId: data.current.term_id,
                sessionName: data.current.session_name,
                termName: data.current.term_name
              })
            });
          }
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to activate session');
      throw error;
    }
  };

  // Activate a term
  const activateTerm = async (termId: string) => {
    try {
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate_term',
          term_id: termId
        })
      });

      if (response.ok) {
        await refreshContext();
        
        // Auto-create payment records for the new term
        const newContext = await fetch('/api/settings/academic-context?action=current');
        if (newContext.ok) {
          const data = await newContext.json();
          if (data.current) {
            await fetch('/api/payments/auto-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
              body: JSON.stringify({
                sessionId: data.current.session_id,
                termId: data.current.term_id,
                sessionName: data.current.session_name,
                termName: data.current.term_name
              })
            });
          }
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate term');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to activate term');
      throw error;
    }
  };

  // Create a new session
  const createSession = async (sessionData: { name: string; start_date: string; end_date: string }) => {
    try {
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          ...sessionData
        })
      });

      if (response.ok) {
        await refreshContext();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session');
      throw error;
    }
  };

  // Create a new term
  const createTerm = async (termData: { session_id: string; name: string; start_date: string; end_date: string }) => {
    try {
      const response = await fetch('/api/settings/academic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_term',
          ...termData
        })
      });

      if (response.ok) {
        await refreshContext();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create term');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create term');
      throw error;
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshContext();
  }, []);

  // Listen for global academic context changes
  useEffect(() => {
    const handleGlobalContextChange = () => {
      console.log('Global academic context changed, refreshing local context...');
      refreshContext();
    };

    const handleForceRefresh = () => {
      console.log('Force refresh triggered for academic context...');
      refreshContext();
    };

    window.addEventListener('academicContextChanged', handleGlobalContextChange);
    window.addEventListener('forcePageRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('academicContextChanged', handleGlobalContextChange);
      window.removeEventListener('forcePageRefresh', handleForceRefresh);
    };
  }, []);

  // Fetch terms when current context changes
  useEffect(() => {
    if (currentContext?.session_id) {
      fetchTerms();
    }
  }, [currentContext?.session_id]);

  const value: AcademicContextType = {
    currentContext,
    sessions,
    terms,
    isLoading,
    error,
    refreshContext,
    activateSession,
    activateTerm,
    createSession,
    createTerm
  };

  return (
    <AcademicContext.Provider value={value}>
      {children}
    </AcademicContext.Provider>
  );
}











