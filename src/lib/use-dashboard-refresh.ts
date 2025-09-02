'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to automatically refresh dashboard data when academic context changes
 * This ensures all dashboard components stay in sync with session/term changes
 */
export function useDashboardRefresh() {
  const router = useRouter();

  const refreshCurrentPage = useCallback(() => {
    // Force a refresh of the current page data
    router.refresh();
  }, [router]);

  const refreshPageData = useCallback(() => {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('refreshPageData'));
  }, []);

  useEffect(() => {
    // Listen for academic context changes
    const handleAcademicContextChange = () => {
      console.log('Academic context changed, refreshing dashboard...');
      refreshCurrentPage();
      refreshPageData();
    };

    // Listen for force page refresh events
    const handleForceRefresh = () => {
      console.log('Force refresh triggered, reloading page...');
      window.location.reload();
    };

    // Listen for dashboard context changes
    const handleDashboardContextChange = (event: CustomEvent) => {
      console.log('Dashboard context changed:', event.detail);
      refreshCurrentPage();
      refreshPageData();
    };

    // Add event listeners
    window.addEventListener('academicContextChanged', handleAcademicContextChange);
    window.addEventListener('forcePageRefresh', handleForceRefresh);
    window.addEventListener('dashboardContextChanged', handleDashboardContextChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('academicContextChanged', handleAcademicContextChange);
      window.removeEventListener('forcePageRefresh', handleForceRefresh);
      window.removeEventListener('dashboardContextChanged', handleDashboardContextChange as EventListener);
    };
  }, [refreshCurrentPage, refreshPageData]);

  return {
    refreshCurrentPage,
    refreshPageData
  };
}



