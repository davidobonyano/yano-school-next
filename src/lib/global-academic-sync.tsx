'use client';

import { useEffect } from 'react';
import { useAcademicContext } from '@/lib/academic-context';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';

/**
 * Component to synchronize local AcademicContext with GlobalAcademicContext
 * This ensures all dashboards stay in sync when session/term changes
 */
export function GlobalAcademicSync() {
  const { currentContext, refreshContext } = useAcademicContext();
  const { academicContext, setAcademicContext } = useGlobalAcademicContext();

  // Sync local context with global context
  useEffect(() => {
    if (currentContext) {
      setAcademicContext({
        session: currentContext.session_name,
        term: currentContext.term_name,
        sessionId: currentContext.session_id,
        termId: currentContext.term_id
      });
    }
  }, [currentContext, setAcademicContext]);

  // Listen for global academic context changes
  useEffect(() => {
    const handleGlobalChange = () => {
      refreshContext();
    };

    window.addEventListener('academicContextChanged', handleGlobalChange);
    return () => {
      window.removeEventListener('academicContextChanged', handleGlobalChange);
    };
  }, [refreshContext]);

  // Trigger payment record creation when context changes
  useEffect(() => {
    if (currentContext) {
      // Debounce the payment record creation
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch('/api/payments/auto-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentContext.session_id,
              termId: currentContext.term_id,
              sessionName: currentContext.session_name,
              termName: currentContext.term_name
            })
          });
          
          if (response.ok) {
            console.log('Payment records auto-created for new period');
          }
        } catch (error) {
          console.error('Failed to auto-create payment records:', error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentContext?.session_id, currentContext?.term_id]);

  return null; // This is a utility component with no UI
}
