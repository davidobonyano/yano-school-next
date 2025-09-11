'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFilter, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import { useAcademicContext } from '@/lib/academic-context';
import { CLASS_LEVELS } from '@/types/courses';

interface Registration {
  student_id: string;
  student_name: string;
  class_level: string;
  stream: string;
  course_code: string;
  course_name: string;
  session: string;
  term: string;
  status: string;
  registered_at: string;
}

export default function AdminRegistrationsPage() {
  const { currentContext } = useAcademicContext();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters - initialize with current academic context
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [termFilter, setTermFilter] = useState<string>('');
  const [classLevelFilter, setClassLevelFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Initialize filters with current context on mount
  useEffect(() => {
    if (currentContext && !sessionFilter) {
      setSessionFilter(currentContext.session_name || '');
      setTermFilter(currentContext.term_name || '');
    }
  }, [currentContext, sessionFilter]);

  const classLevelOptions = ['All', ...CLASS_LEVELS];
  const statusOptions = ['All', 'pending', 'approved', 'rejected'];

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sessionFilter) params.set('session', sessionFilter);
      if (termFilter) params.set('term', termFilter);
      if (classLevelFilter && classLevelFilter !== 'All') params.set('class_level', classLevelFilter);
      
      const response = await fetch(`/api/registrations/list?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch registrations');
      const data = await response.json();
      
      let filtered = data.registrations || [];
      if (statusFilter && statusFilter !== 'All') {
        filtered = filtered.filter((r: Registration) => r.status === statusFilter);
      }
      
      setRegistrations(filtered);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [sessionFilter, termFilter, classLevelFilter, statusFilter]);

  const exportToCSV = () => {
    if (registrations.length === 0) return;
    
    const headers = ['Student ID', 'Student Name', 'Class', 'Stream', 'Course Code', 'Course Name', 'Session', 'Term', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      r.student_id,
      r.student_name,
      r.class_level,
      r.stream,
      r.course_code,
      r.course_name,
      r.session,
      r.term,
      r.status,
      new Date(r.registered_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-green-600" />
            Course Registrations
          </h1>
          <p className="text-gray-600">
            Viewing: <span className="font-medium text-gray-900">
              {sessionFilter || 'All Sessions'} • {termFilter || 'All Terms'}
            </span>
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={registrations.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Session</label>
            <input
              type="text"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              placeholder="Enter session (e.g., 2023/2024)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Term</label>
            <input
              type="text"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              placeholder="Enter term (e.g., First Term)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Class Level</label>
            <select
              value={classLevelFilter}
              onChange={(e) => setClassLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              {classLevelOptions.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${registrations.length} registrations found`}
          </span>
          <button
            onClick={fetchRegistrations}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No registrations found matching the current filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Stream</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session/Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration, index) => (
                  <tr key={`${registration.student_id}-${registration.course_code}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{registration.student_name}</div>
                        <div className="text-xs text-gray-500">{registration.student_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.class_level}
                      {registration.stream && ` • ${registration.stream}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{registration.course_code}</div>
                        <div className="text-xs text-gray-500">{registration.course_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.session} • {registration.term}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                        {registration.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(registration.registered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
