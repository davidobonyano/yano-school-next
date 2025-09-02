'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { ContextSyncStatus } from '@/components/academic-context/ContextSyncStatus';

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      {/* Context Sync Status - for debugging session/term sync */}
      <div className="mb-6">
        <ContextSyncStatus />
      </div>
      
      {/* Original Admin Dashboard Content */}
      <AdminDashboard />
    </div>
  );
}