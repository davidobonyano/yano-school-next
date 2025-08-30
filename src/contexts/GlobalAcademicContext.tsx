'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AcademicContext {
  session: string;
  term: string;
  sessionId: string;
  termId: string;
}

interface GlobalAcademicContextType {
  academicContext: AcademicContext;
  setAcademicContext: (context: AcademicContext) => void;
  updateSession: (session: string) => void;
  updateTerm: (term: string) => void;
  isLoading: boolean;
}

const GlobalAcademicContext = createContext<GlobalAcademicContextType | undefined>(undefined);

export function GlobalAcademicContextProvider({ children }: { children: ReactNode }) {
  const [academicContext, setAcademicContext] = useState<AcademicContext>({
    session: '2025/2026',
    term: '1st Term',
    sessionId: '',
    termId: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current academic context on mount
  useEffect(() => {
    fetchCurrentAcademicContext();
  }, []);

  const fetchCurrentAcademicContext = async () => {
    try {
      const response = await fetch('/api/settings/academic-context');
      if (response.ok) {
        const data = await response.json();
        if (data.currentContext) {
          setAcademicContext({
            session: data.currentContext.session_name,
            term: data.currentContext.term_name,
            sessionId: data.currentContext.session_id,
            termId: data.currentContext.term_id
          });
        }
      }
    } catch (error) {
      console.error('Error fetching academic context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (session: string) => {
    try {
      const response = await fetch('/api/settings/academic-context/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      });

      if (response.ok) {
        const data = await response.json();
        setAcademicContext(prev => ({
          ...prev,
          session: data.session_name,
          sessionId: data.session_id
        }));
        
        // Trigger a global refresh event
        window.dispatchEvent(new CustomEvent('academicContextChanged'));
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const updateTerm = async (term: string) => {
    try {
      const response = await fetch('/api/settings/academic-context/term', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
      });

      if (response.ok) {
        const data = await response.json();
        setAcademicContext(prev => ({
          ...prev,
          term: data.term_name,
          termId: data.term_id
        }));
        
        // Trigger a global refresh event
        window.dispatchEvent(new CustomEvent('academicContextChanged'));
      }
    } catch (error) {
      console.error('Error updating term:', error);
    }
  };

  const value: GlobalAcademicContextType = {
    academicContext,
    setAcademicContext,
    updateSession,
    updateTerm,
    isLoading
  };

  return (
    <GlobalAcademicContext.Provider value={value}>
      {children}
    </GlobalAcademicContext.Provider>
  );
}

export function useGlobalAcademicContext() {
  const context = useContext(GlobalAcademicContext);
  if (context === undefined) {
    throw new Error('useGlobalAcademicContext must be used within a GlobalAcademicContextProvider');
  }
  return context;
}
