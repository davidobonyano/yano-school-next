'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faFilter, 
  faSearch, 
  faRefresh,
  faFileExport,
  faCalendar,
  faUser,
  faMoneyBillWave,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

type PaymentRecord = {
  id: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  session_id: string;
  session_name?: string;
  term_id: string;
  term_name?: string;
  purpose: string;
  amount: number;
  paid_on: string;
  reference: string | null;
  created_at: string;
};

type AcademicSession = {
  id: string;
  name: string;
  is_active: boolean;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
  is_active: boolean;
};

type FilterState = {
  sessionId: string;
  termId: string;
  studentCode: string;
  purpose: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};

export default function PaymentHistoryReportPage() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    sessionId: '',
    termId: '',
    studentCode: '',
    purpose: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Load academic context
  async function loadAcademicContext() {
    setLoadingContext(true);
    try {
      const [sessionsRes, termsRes] = await Promise.all([
        fetch('/api/academic/sessions', { cache: 'no-store' }),
        fetch('/api/academic/terms', { cache: 'no-store' })
      ]);
      
      const sessionsData = await sessionsRes.json();
      const termsData = await termsRes.json();
      
      if (sessionsRes.ok) {
        const sessions = sessionsData.sessions || [];
        setSessions(sessions);
      }
      
      if (termsRes.ok) {
        const terms = termsData.terms || [];
        // Filter to only show standard terms (1st, 2nd, 3rd Term)
        const standardTerms = terms.filter((term: any) => 
          term.name === '1st Term' || term.name === '2nd Term' || term.name === '3rd Term'
        );
        setTerms(standardTerms);
      }
    } catch (e) {
      console.error('Failed to load academic context:', e);
    } finally {
      setLoadingContext(false);
    }
  }

  // Load payment records
  async function loadPaymentRecords() {
    setLoading(true);
    try {
      const url = new URL('/api/admin/payment-records', window.location.origin);
      
      // Apply filters
      if (filters.sessionId) url.searchParams.set('sessionId', filters.sessionId);
      if (filters.termId) url.searchParams.set('termId', filters.termId);
      if (filters.purpose) url.searchParams.set('purpose', filters.purpose);
      if (filters.studentCode) url.searchParams.set('studentId', filters.studentCode);
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load payment records');
      
      let records = json.items || [];
      
      // Apply client-side filters
      if (filters.dateFrom) {
        records = records.filter((r: PaymentRecord) => new Date(r.paid_on) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        records = records.filter((r: PaymentRecord) => new Date(r.paid_on) <= new Date(filters.dateTo));
      }
      if (filters.minAmount) {
        records = records.filter((r: PaymentRecord) => r.amount >= Number(filters.minAmount));
      }
      if (filters.maxAmount) {
        records = records.filter((r: PaymentRecord) => r.amount <= Number(filters.maxAmount));
      }
      
      setPaymentRecords(records);
    } catch (e) {
      console.error('Failed to load payment records:', e);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalRecords = paymentRecords.length;
    const uniqueStudents = new Set(paymentRecords.map(r => r.student_id)).size;
    
    const byPurpose = paymentRecords.reduce((acc, record) => {
      acc[record.purpose] = (acc[record.purpose] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalAmount, totalRecords, uniqueStudents, byPurpose };
  }, [paymentRecords]);

  // Pagination
  const totalPages = Math.ceil(paymentRecords.length / recordsPerPage);
  const paginatedRecords = paymentRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Export to CSV
  function exportToCSV() {
    const headers = ['Student Code', 'Student Name', 'Session', 'Term', 'Purpose', 'Amount', 'Date', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...paginatedRecords.map(record => [
        record.student_code || '',
        record.student_name || '',
        record.session_name || '',
        record.term_name || '',
        record.purpose,
        record.amount,
        record.paid_on,
        record.reference || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    loadAcademicContext();
  }, []);

  useEffect(() => {
    loadPaymentRecords();
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History Report</h1>
        <p className="text-gray-600">Comprehensive payment records across all terms and sessions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₦{totals.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faReceipt} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalRecords}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faUser} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Students</p>
              <p className="text-2xl font-bold text-gray-900">{totals.uniqueStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FontAwesomeIcon icon={faCalendar} className="text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pages</p>
              <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faFilter} />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={loadPaymentRecords}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRefresh} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faFileExport} />
              Export CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
              <select 
                value={filters.sessionId} 
                onChange={(e) => setFilters({ ...filters, sessionId: e.target.value, termId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingContext}
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.is_active ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select 
                value={filters.termId} 
                onChange={(e) => setFilters({ ...filters, termId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingContext || !filters.sessionId}
              >
                <option value="">All Terms</option>
                {terms
                  .filter(term => !filters.sessionId || term.session_id === filters.sessionId)
                  .map((term) => {
                    const session = sessions.find(s => s.id === term.session_id);
                    return (
                      <option key={term.id} value={term.id}>
                        {term.name} - {session?.name || 'Unknown Session'} {term.is_active ? '(Current)' : ''}
                      </option>
                    );
                  })}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Code</label>
              <input
                type="text"
                placeholder="e.g., YAN006"
                value={filters.studentCode}
                onChange={(e) => setFilters({ ...filters, studentCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
              <select 
                value={filters.purpose} 
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Purposes</option>
                <option value="Tuition">Tuition</option>
                <option value="Exam">Exam</option>
                <option value="Uniform">Uniform</option>
                <option value="PTA">PTA</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (₦)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (₦)</label>
              <input
                type="number"
                placeholder="1000000"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Payment Records</h3>
          <p className="text-sm text-gray-600">
            Showing {paginatedRecords.length} of {paymentRecords.length} records
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading payment records...</div>
        ) : paginatedRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payment records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student_code || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.student_name || 'Unknown Student'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.session_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.term_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₦{Number(record.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.paid_on).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.reference || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
