'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAcademicContext } from '@/lib/academic-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faGraduationCap, 
  faBookOpen, 
  faCreditCard, 
  faFilter,
  faDownload,
  faCalendarAlt,
  faUsers,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { exportToCSV, formatDataForExport } from '@/lib/export-utils';

type SessionSummary = {
  expected: number;
  collected: number;
  outstanding: number;
  term: string;
  session: string;
};

type RevenueSummary = {
  expectedRevenue: number;
  actualRevenue: number;
  outstanding: number;
  collectionRate: number;
  totalStudents: number;
};

type OutstandingRow = {
  class_level: string;
  stream: string | null;
  student_id: string;
  full_name: string;
  outstanding: number;
  status: 'Outstanding' | 'Paid';
};

type HistoricalSession = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  terms: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  }[];
};

type CourseRegistrationSummary = {
  student_id: string;
  student_name: string;
  class_level: string;
  stream: string | null;
  term: string;
  session: string;
  total_registrations: number;
  approved_registrations: number;
  pending_registrations: number;
  rejected_registrations: number;
};

type CourseRegistrationDetail = {
  id: string;
  course_name: string;
  class_level: string;
  stream: string | null;
  term: string;
  session: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  registered_at: string;
};

type GraduatedStudent = {
  student_id: string;
  full_name: string;
  class_level: string;
  stream: string | null;
  graduation_date: string;
  session: string;
};

type PaymentHistory = {
  id: string;
  student_name: string;
  student_id: string;
  amount: number;
  payment_method: string;
  description: string;
  transaction_date: string;
  session: string;
  term: string;
  recorded_by: string;
};

export default function AdminReportsPage() {
  const { currentContext } = useAcademicContext();
  const [activeTab, setActiveTab] = useState<'current' | 'historical' | 'registrations' | 'graduates' | 'payments'>('current');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  
  // Current period data
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
  
  // Historical data
  const [historicalSessions, setHistoricalSessions] = useState<HistoricalSession[]>([]);
  const [courseRegistrations, setCourseRegistrations] = useState<CourseRegistrationSummary[]>([]);
  const [courseRegistrationDetails, setCourseRegistrationDetails] = useState<CourseRegistrationDetail[]>([]);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<string | null>(null);
  const [graduatedStudents, setGraduatedStudents] = useState<GraduatedStudent[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => ({
    term: currentContext?.term_name || 'First Term',
    session: currentContext?.session_name || '2024/2025'
  }), [currentContext?.term_name, currentContext?.session_name]);

  // Load current period data
  const loadCurrentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ term: period.term, session: period.session });

        const [summaryRes, revenueRes, outstandingRes] = await Promise.all([
          fetch(`/api/reports/session-summary?${params.toString()}`, { cache: 'no-store' }),
          fetch(`/api/reports/expected-revenue?${params.toString()}`, { cache: 'no-store' }),
          fetch(`/api/reports/outstanding?${params.toString()}`, { cache: 'no-store' })
        ]);

        const [summaryJson, revenueJson, outstandingJson] = await Promise.all([
          summaryRes.json(), revenueRes.json(), outstandingRes.json()
        ]);

        if (!summaryRes.ok) throw new Error(summaryJson.error || 'Failed to load summary');
        if (!revenueRes.ok) throw new Error(revenueJson.error || 'Failed to load revenue');
        if (!outstandingRes.ok) throw new Error(outstandingJson.error || 'Failed to load outstanding');

        setSummary(summaryJson.summary || null);
        setRevenue(revenueJson || null);
        setOutstanding(outstandingJson.outstanding || []);
      } catch (e: any) {
        setError(e?.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
  };

  // Load historical sessions
  const loadHistoricalSessions = async () => {
    try {
      const response = await fetch('/api/reports/historical-sessions', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setHistoricalSessions(data.sessions || []);
      } else {
        throw new Error(data.error || 'Failed to load historical sessions');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load historical sessions');
    }
  };

  // Load course registration history
  const loadCourseRegistrations = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSession) params.append('session', selectedSession);
      if (selectedTerm) params.append('term', selectedTerm);
      
      const response = await fetch(`/api/reports/course-registrations?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setCourseRegistrations(data.registrations || []);
      } else {
        throw new Error(data.error || 'Failed to load course registrations');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load course registrations');
    }
  };

  // Load detailed course registrations for a specific student
  const loadCourseRegistrationDetails = async (studentId: string) => {
    try {
      const params = new URLSearchParams();
      params.append('studentId', studentId);
      if (selectedSession) params.append('session', selectedSession);
      if (selectedTerm) params.append('term', selectedTerm);
      
      const response = await fetch(`/api/reports/course-registrations?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setCourseRegistrationDetails(data.registrations || []);
        setSelectedStudentForDetails(studentId);
      } else {
        throw new Error(data.error || 'Failed to load course registration details');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load course registration details');
    }
  };

  // Load graduated students
  const loadGraduatedStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSession) params.append('session', selectedSession);
      
      const response = await fetch(`/api/reports/graduated-students?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setGraduatedStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Failed to load graduated students');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load graduated students');
    }
  };

  // Load payment history
  const loadPaymentHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSession) params.append('session', selectedSession);
      if (selectedTerm) params.append('term', selectedTerm);
      
      const response = await fetch(`/api/reports/payment-history?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) {
        setPaymentHistory(data.payments || []);
      } else {
        throw new Error(data.error || 'Failed to load payment history');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load payment history');
    }
  };

  useEffect(() => {
    if (activeTab === 'current') {
      loadCurrentData();
    } else if (activeTab === 'historical') {
      loadHistoricalSessions();
    } else if (activeTab === 'registrations') {
      loadCourseRegistrations();
    } else if (activeTab === 'graduates') {
      loadGraduatedStudents();
    } else if (activeTab === 'payments') {
      loadPaymentHistory();
    }
  }, [activeTab, selectedSession, selectedTerm, period.term, period.session]);

  const formatNaira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  // Export functions
  const handleExportCourseRegistrations = () => {
    const formattedData = courseRegistrations.map(item => ({
      'Student Name': item.student_name,
      'Student ID': item.student_id,
      'Class': item.class_level,
      'Stream': item.stream || '',
      'Session': item.session,
      'Term': item.term,
      'Total Registrations': item.total_registrations,
      'Approved': item.approved_registrations,
      'Pending': item.pending_registrations,
      'Rejected': item.rejected_registrations
    }));
    const filename = `course-registrations-summary-${selectedSession || 'all-sessions'}-${selectedTerm || 'all-terms'}`;
    exportToCSV(formattedData, filename);
  };

  const handleExportGraduatedStudents = () => {
    const formattedData = formatDataForExport(graduatedStudents, 'graduated-students');
    const filename = `graduated-students-${selectedSession || 'all-sessions'}`;
    exportToCSV(formattedData, filename);
  };

  const handleExportPaymentHistory = () => {
    const formattedData = formatDataForExport(paymentHistory, 'payment-history');
    const filename = `payment-history-${selectedSession || 'all-sessions'}-${selectedTerm || 'all-terms'}`;
    exportToCSV(formattedData, filename);
  };

  const tabs = [
    { id: 'current', label: 'Current Period', icon: faChartLine },
    { id: 'historical', label: 'Session History', icon: faHistory },
    { id: 'registrations', label: 'Course Registrations', icon: faBookOpen },
    { id: 'graduates', label: 'Graduated Students', icon: faGraduationCap },
    { id: 'payments', label: 'Payment History', icon: faCreditCard }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Reports</h1>
        <p className="text-gray-600">Comprehensive historical and current period reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters for historical data */}
      {(activeTab !== 'current') && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Sessions</option>
                  {historicalSessions.map((session) => (
                    <option key={session.id} value={session.name}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Terms</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Current Period Tab */}
          {activeTab === 'current' && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Expected Collection</h3>
              <p className="text-2xl font-bold">{formatNaira(summary?.expected || revenue?.expectedRevenue || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Collected</h3>
              <p className="text-2xl font-bold">{formatNaira(summary?.collected || revenue?.actualRevenue || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Outstanding</h3>
              <p className="text-2xl font-bold text-yellow-700">{formatNaira(summary?.outstanding || revenue?.outstanding || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Collection Rate</h3>
              <p className="text-2xl font-bold">{(revenue?.collectionRate ?? 0).toFixed(1)}%</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Outstanding by Class</h2>
            <div className="overflow-hidden rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outstanding.map((r) => (
                    <tr key={`${r.student_id}-${r.class_level}-${r.stream || ''}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.class_level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.stream || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.student_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatNaira(r.outstanding)}</td>
                    </tr>
                  ))}
                  {outstanding.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600" colSpan={5}>No outstanding data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}

          {/* Historical Sessions Tab */}
          {activeTab === 'historical' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Academic Session History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historicalSessions.map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                      {session.is_active && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>{formatDate(session.start_date)} - {formatDate(session.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUsers} />
                        <span>{session.terms.length} Terms</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Terms:</h4>
                      <div className="space-y-1">
                        {session.terms.map((term) => (
                          <div key={term.id} className="text-xs text-gray-600">
                            {term.name}: {formatDate(term.start_date)} - {formatDate(term.end_date)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Registrations Tab */}
          {activeTab === 'registrations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Course Registration History</h2>
                <button 
                  onClick={handleExportCourseRegistrations}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export CSV
                </button>
              </div>

              {selectedStudentForDetails ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <button 
                      onClick={() => {
                        setSelectedStudentForDetails(null);
                        setCourseRegistrationDetails([]);
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      ← Back to Summary
                    </button>
                    <h3 className="text-lg font-medium text-gray-800">
                      Course Details for {courseRegistrationDetails[0]?.class_level} Student
                    </h3>
                  </div>
                  
                  <div className="overflow-hidden rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courseRegistrationDetails.map((reg) => (
                          <tr key={reg.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.course_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reg.class_level} {reg.stream && `(${reg.stream})`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.session}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.term}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                                reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reg.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(reg.registered_at)}</td>
                          </tr>
                        ))}
                        {courseRegistrationDetails.length === 0 && (
                          <tr>
                            <td className="px-6 py-4 text-sm text-gray-600" colSpan={6}>No course registrations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseRegistrations.map((reg) => (
                        <tr 
                          key={`${reg.student_id}-${reg.session}-${reg.term}`} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => loadCourseRegistrationDetails(reg.student_id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reg.class_level} {reg.stream && `(${reg.stream})`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.session}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.term}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reg.total_registrations}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{reg.approved_registrations}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{reg.pending_registrations}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{reg.rejected_registrations}</td>
                        </tr>
                      ))}
                      {courseRegistrations.length === 0 && (
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-600" colSpan={9}>No course registrations found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Graduated Students Tab */}
          {activeTab === 'graduates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Graduated Students</h2>
                <button 
                  onClick={handleExportGraduatedStudents}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export Alumni List
                </button>
              </div>
              <div className="overflow-hidden rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {graduatedStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class_level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.stream || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.session}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(student.graduation_date)}</td>
                      </tr>
                    ))}
                    {graduatedStudents.length === 0 && (
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-600" colSpan={6}>No graduated students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
                <button 
                  onClick={handleExportPaymentHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.student_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatNaira(payment.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payment_method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.session}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.term}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.transaction_date)}</td>
                      </tr>
                    ))}
                    {paymentHistory.length === 0 && (
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-600" colSpan={8}>No payment history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




