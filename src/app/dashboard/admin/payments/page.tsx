'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard,
  faEdit, 
  faPlus,
  faSearch,
  faFilter,
  faDownload,
  faCheck,
  faTimes,
  faClock,
  faRefresh,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';
import { PaymentContextDisplay } from '@/components/payments/PaymentContextDisplay';
import { FeeStructureManager } from '@/components/payments/FeeStructureManager';
import { CarryOverModal } from '@/components/payments/CarryOverModal';

type PaymentRecord = {
  id: string;
  studentId: string;
  studentName: string;
  classLabel: string;
  amount: number;
  description: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Outstanding';
  term: string;
  session: string;
  billed: number;
  paid: number;
  outstanding: number;
};

type PaymentStatistics = {
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  pendingCount: number;
  outstandingCount: number;
  paidCount: number;
  pendingAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  totalOutstanding: number;
  paymentCompletionRate: number;
  statusSummary: {
    pending: { count: number; amount: number };
    outstanding: { count: number; amount: number };
    paid: { count: number; amount: number };
  };
};

type StudentPaymentHistory = {
  studentId: string;
  studentName: string;
  classLabel: string;
  session: string;
  term: string;
  billed: number;
  paid: number;
  outstanding: number;
  status: 'Paid' | 'Partial' | 'Outstanding' | 'Pending';
  lastPaymentDate?: string;
};

export default function PaymentRecordsPage() {
  const { academicContext } = useGlobalAcademicContext();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<StudentPaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const paymentsLoadId = useRef(0);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'carryover'>('current');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'outstanding'>('all');
  const [carryOverData, setCarryOverData] = useState<any[]>([]);
  const [showCarryOverModal, setShowCarryOverModal] = useState(false);
  
  // Modals
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [lookupStudentId, setLookupStudentId] = useState('');
  const [studentSummary, setStudentSummary] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Use global academic context
  const effectiveSession = academicContext.session;
  const effectiveTerm = academicContext.term;

  // Removed session/term loading effects

  // Load payment data and statistics
  const loadData = useCallback(async (showLoader = true) => {
    if (!effectiveSession || !effectiveTerm) return;
    
    const loadId = ++paymentsLoadId.current;
    if (showLoader) setIsLoading(true);

    try {
      // Load payment records and statistics in parallel
      const [paymentsResponse, statisticsResponse, receiptsResponse, historyResponse, carryOverResponse] = await Promise.all([
        fetch(`/api/payments?term=${encodeURIComponent(effectiveTerm)}&session=${encodeURIComponent(effectiveSession)}`, { 
          cache: 'no-store',
          credentials: 'include'
        }),
        fetch(`/api/payments/statistics?term=${encodeURIComponent(effectiveTerm)}&session=${encodeURIComponent(effectiveSession)}`, { 
          cache: 'no-store',
          credentials: 'include'
        }),
        fetch(`/api/receipts?term=${encodeURIComponent(effectiveTerm)}&session=${encodeURIComponent(effectiveSession)}&limit=10`, {
          cache: 'no-store',
          credentials: 'include'
        }),
        fetch(`/api/admin/payment-history?term=${encodeURIComponent(effectiveTerm)}&session=${encodeURIComponent(effectiveSession)}`, { 
          cache: 'no-store',
          credentials: 'include'
        }),
        fetch(`/api/admin/carry-over-balances?term=${encodeURIComponent(effectiveTerm)}&session=${encodeURIComponent(effectiveSession)}`, { 
          cache: 'no-store',
          credentials: 'include'
        })
      ]);

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsLoadId.current === loadId) {
          setPayments(paymentsData.payments || []);
        }
      }

      if (statisticsResponse.ok) {
        const statisticsData = await statisticsResponse.json();
        if (paymentsLoadId.current === loadId) {
          setStatistics(statisticsData.statistics);
        }
      }

      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        if (paymentsLoadId.current === loadId) {
          setRecentReceipts(receiptsData.receipts || []);
        }
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (paymentsLoadId.current === loadId) {
          setStudentPaymentHistory(historyData.history || []);
        }
      }

      if (carryOverResponse.ok) {
        const carryOverData = await carryOverResponse.json();
        if (paymentsLoadId.current === loadId) {
          setCarryOverData(carryOverData.students || []);
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [academicContext]);

  // Auto-refresh data when academic context changes
  useEffect(() => {
    if (academicContext.session && academicContext.term) {
      loadData();
    }
  }, [academicContext, loadData]);

  // Refresh data manually
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
  };

  // Create payment records for new period
  const handleGeneratePaymentRecords = async () => {
    if (!effectiveSession || !effectiveTerm) return;
    
    try {
      const response = await fetch('/api/payments/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
        body: JSON.stringify({ 
          // prefer names; backend endpoint supports names too
          sessionName: effectiveSession,
          termName: effectiveTerm
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! ${result.message}`);
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating payment records:', error);
      alert('Failed to generate payment records. Please try again.');
    }
  };

  // Student lookup
  const handleStudentLookup = async () => {
    if (!lookupStudentId.trim() || !effectiveSession || !effectiveTerm) return;
    
    setIsLookingUp(true);
    setStudentSummary(null);
    
    try {
      const response = await fetch('/api/students/financial-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: lookupStudentId.trim(), 
          term: effectiveTerm, 
          session: effectiveSession 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentSummary(data.summary);
      }
    } catch (error) {
      console.error('Error looking up student:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Add payment
  const handleAddPayment = async (newPayment: { 
    studentId: string; 
    amount: number; 
    description?: string; 
    method?: 'Cash' | 'Transfer' | 'POS' | 'Online'; 
  }) => {
    if (!effectiveSession || !effectiveTerm) return;
    
    setShowAddPayment(false);
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: newPayment.studentId,
          term: effectiveTerm,
          session: effectiveSession,
          amount: Number(newPayment.amount || 0),
          method: newPayment.method || 'Cash',
          description: newPayment.description || 'Payment received'
        })
      });

      if (response.ok) {
        const result = await response.json();
        try {
          const applied = Number(result?.applied_amount ?? result?.result?.applied_amount ?? 0);
          const original = Number(result?.original_amount ?? newPayment.amount ?? 0);
          const capped = Boolean(result?.capped);
          const remainingNote = typeof result?.result?.remaining_amount !== 'undefined' ? ` Remaining: ₦${Number(result.result.remaining_amount).toLocaleString()}.` : '';
          const msg = capped
            ? `Payment recorded. Applied ₦${applied.toLocaleString()} (capped from ₦${original.toLocaleString()}).${remainingNote}`
            : `Payment recorded successfully. Applied ₦${applied.toLocaleString() || original.toLocaleString()}.${remainingNote}`;
          alert(msg);
        } catch {
          // Fallback generic success
          alert('Payment recorded successfully.');
        }
        await loadData(true); // Refresh data after payment
      } else {
        const errorData = await response.json();
        alert(`Failed to record payment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };
  
  // Edit payment
  // Change Status / record additional payment
  const handleSaveEdit = async (updatedPayment: PaymentRecord) => {
    if (!effectiveSession || !effectiveTerm) return;
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: updatedPayment.studentId,
          term: effectiveTerm,
          session: effectiveSession,
          amount: Number(updatedPayment.amount || 0),
          method: 'Cash', // UI can be extended to select method
          description: updatedPayment.description || 'Payment updated'
        })
      });

      if (response.ok) {
        const result = await response.json();
        try {
          const applied = Number(result?.applied_amount ?? result?.result?.applied_amount ?? 0);
          const original = Number(result?.original_amount ?? updatedPayment.amount ?? 0);
          const capped = Boolean(result?.capped);
          const remainingNote = typeof result?.result?.remaining_amount !== 'undefined' ? ` Remaining: ₦${Number(result.result.remaining_amount).toLocaleString()}.` : '';
          const msg = capped
            ? `Payment recorded. Applied ₦${applied.toLocaleString()} (capped from ₦${original.toLocaleString()}).${remainingNote}`
            : `Payment recorded successfully. Applied ₦${applied.toLocaleString() || original.toLocaleString()}.${remainingNote}`;
          alert(msg);
        } catch {
          alert('Payment recorded successfully!');
        }
        setEditingPayment(null);
        await loadData(true); // Refresh data and statistics after update
      } else {
        const errorData = await response.json();
        console.error('Payment recording failed:', errorData);
        alert(`Failed to update payment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesClass = !classFilter || payment.classLabel?.toLowerCase().includes(classFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  // Get unique values for filters
  const classes = [...new Set(payments.map(p => p.classLabel).filter(Boolean))];
  const statuses = ['Paid', 'Pending', 'Outstanding'];

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Outstanding': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading payment data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Fee Structure Management */}
      <FeeStructureManager className="max-w-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faCreditCard} className="w-6 h-6 text-green-600" />
            Payment Management
          </h1>
          <p className="text-gray-600">{effectiveSession || 'Loading...'} – {effectiveTerm || 'Loading...'}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faRefresh} className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Record Payment
          </button>
          <button 
            onClick={handleGeneratePaymentRecords}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
            Generate Records
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
            Current Term Payments
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('carryover')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'carryover'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faClock} className="mr-2" />
            Carry Over Balances
          </button>
        </nav>
      </div>

      {/* Current Term Content */}
      {activeTab === 'current' && (
        <>
          {/* Statistics Cards */}
          {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3 mr-4">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-gray-900">₦{statistics.totalCollected.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{statistics.collectionRate.toFixed(1)}% of expected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3 mr-4">
                <FontAwesomeIcon icon={faCreditCard} className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Expected</p>
                <p className="text-2xl font-bold text-gray-900">₦{statistics.totalExpected.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{statistics.totalStudents} students</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pendingCount}</p>
                <p className="text-xs text-gray-500">₦{statistics.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-lg p-3 mr-4">
                <FontAwesomeIcon icon={faTimes} className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.outstandingCount}</p>
                <p className="text-xs text-gray-500">₦{statistics.outstandingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fully Paid</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.paidCount}</p>
                <p className="text-xs text-gray-500">{statistics.paymentCompletionRate.toFixed(1)}% completion</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {recentReceipts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.receipt_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{r.student_name || r.student_id}</div>
                      <div className="text-gray-500 text-xs">{r.student_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">₦{Number(r.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(r.method || '').toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.issued_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Lookup */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID Lookup</label>
            <input
              type="text"
              value={lookupStudentId}
              onChange={(e) => setLookupStudentId(e.target.value.toUpperCase())}
              placeholder="e.g. YAN001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleStudentLookup()}
            />
          </div>
          <button
            onClick={handleStudentLookup}
            className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={isLookingUp}
          >
            {isLookingUp ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        
        {studentSummary && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Expected</div>
              <div className="text-lg font-semibold">₦{Number(studentSummary.billed_total || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Paid</div>
              <div className="text-lg font-semibold text-green-600">₦{Number(studentSummary.paid_total || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="text-lg font-semibold text-red-600">₦{Number(studentSummary.outstanding_total || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Status</div>
              <div className={`inline-block px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(studentSummary.payment_status || 'Pending')}`}>
                {studentSummary.payment_status || 'Pending'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(classLabel => (
              <option key={classLabel} value={classLabel}>{classLabel}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-600 col-span-3">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            Showing {filteredPayments.length} of {payments.length} records
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                      <div className="text-sm text-gray-500">{payment.studentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.classLabel || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{payment.billed.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">₦{payment.paid.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">₦{payment.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setEditingPayment(payment)} 
                        className="text-indigo-600 hover:text-indigo-900" 
                        title="Record Payment"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </button>
                      <a 
                        className="text-blue-600 hover:underline" 
                        href={`/dashboard/admin/students/${encodeURIComponent(payment.studentId)}/payments`} 
                        title="Payment History"
                      >
                        History
                      </a>
                      <a 
                        className="text-green-600 hover:underline" 
                        href={`/api/receipts?studentId=${encodeURIComponent(payment.studentId)}&term=${encodeURIComponent(academicContext.term)}&session=${encodeURIComponent(academicContext.session)}`} 
                        title="Receipt" 
                        target="_blank"
                      >
                        Receipt
                      </a>
                      <button
                        onClick={async () => {
                          if (!academicContext.session || !academicContext.term) return;
                          const confirmed = confirm(`Reset payments for ${payment.studentName} (${payment.studentId}) in ${academicContext.session} – ${academicContext.term}?`);
                          if (!confirmed) return;
                          try {
                            const res = await fetch('/api/payments/reset', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                studentId: payment.studentId,
                                term: academicContext.term,
                                session: academicContext.session
                              })
                            });
                            if (res.ok) {
                              await loadData(true);
                            } else {
                              const j = await res.json();
                              alert(j.error || 'Failed to reset payments');
                            }
                          } catch (e) {
                            alert('Failed to reset payments');
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Reset Payments to Pending"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payment records found.</p>
            <button 
              onClick={handleGeneratePaymentRecords}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Payment Records for This Period
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {/* Payment History Content */}
      {activeTab === 'history' && (
        <>
          {/* History Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'outstanding')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Students</option>
                  <option value="outstanding">Outstanding Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentPaymentHistory
                    .filter(student => historyFilter === 'all' || student.outstanding > 0)
                    .map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-sm text-gray-500">{student.studentId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.classLabel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{student.billed.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">₦{student.paid.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">₦{student.outstanding.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {studentPaymentHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No payment history found for this term.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Carry Over Balances Content */}
      {activeTab === 'carryover' && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Outstanding Balances for Carry Over</h2>
              <button
                onClick={() => setShowCarryOverModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                disabled={carryOverData.length === 0}
              >
                <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                Carry Over to Next Term
              </button>
            </div>
            
            {carryOverData.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 text-4xl mb-4" />
                <p className="text-gray-600">No outstanding balances to carry over</p>
                <p className="text-sm text-gray-500 mt-2">All students have cleared their fees for this term</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {carryOverData.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.classLabel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700">
                          ₦{student.outstandingAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Outstanding
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <AddPaymentModal 
          onAdd={handleAddPayment} 
          onClose={() => setShowAddPayment(false)} 
        />
      )}
      
      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onSave={handleSaveEdit}
          onClose={() => setEditingPayment(null)}
        />
      )}

      {/* Carry Over Modal */}
      {showCarryOverModal && (
        <CarryOverModal
          students={carryOverData}
          currentSession={academicContext.session}
          currentTerm={academicContext.term}
          onCarryOver={async (toSession, toTerm) => {
            try {
              const response = await fetch('/api/admin/carry-over-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fromSession: academicContext.session,
                  fromTerm: academicContext.term,
                  toSession,
                  toTerm,
                  studentIds: carryOverData.map(s => s.studentId)
                })
              });

              if (response.ok) {
                const result = await response.json();
                alert(`Successfully carried over ${result.carriedOver} balances totaling ₦${result.totalAmount.toLocaleString()}`);
                setShowCarryOverModal(false);
                await loadData(true); // Refresh data
              } else {
                const error = await response.json();
                alert(`Failed to carry over balances: ${error.error}`);
              }
            } catch (error) {
              alert('Failed to carry over balances. Please try again.');
            }
          }}
          onClose={() => setShowCarryOverModal(false)}
        />
      )}
    </div>
  );
}

// Add Payment Modal Component
function AddPaymentModal({ 
  onAdd, 
  onClose 
}: { 
  onAdd: (payment: { studentId: string; amount: number; description?: string; method?: 'Cash' | 'Transfer' | 'POS' | 'Online'; }) => void; 
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    description: '',
    method: 'Cash' as 'Cash' | 'Transfer' | 'POS' | 'Online',
    status: 'Pending' as 'Pending' | 'Outstanding' | 'Paid'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      studentId: formData.studentId,
      amount: Number(formData.amount),
      description: formData.description,
      method: formData.method
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Record / Change Status</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. YAN001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value as 'Cash' | 'Transfer' | 'POS' | 'Online' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Transfer">Bank Transfer</option>
              <option value="POS">POS</option>
              <option value="Online">Online Payment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Change Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Pending' | 'Outstanding' | 'Paid' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Paid">Paid</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Status will be derived from amounts; set Paid only if amount equals outstanding.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Payment for..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Payment Modal Component
function EditPaymentModal({ 
  payment, 
  onSave, 
  onClose 
}: { 
  payment: PaymentRecord; 
  onSave: (payment: PaymentRecord) => void; 
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    amount: 0,
    description: 'Additional payment'
  });

  // Derived projections based on entered amount
  const projectedPaid = Math.max(0, Number(payment.paid || 0) + Number(formData.amount || 0));
  const projectedOutstanding = Math.max(0, Number(payment.billed || 0) - projectedPaid);
  const projectedStatus: 'Paid' | 'Pending' | 'Outstanding' = projectedPaid === 0
    ? 'Pending'
    : (projectedPaid >= Number(payment.billed || 0) ? 'Paid' : 'Outstanding');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...payment,
      amount: Number(formData.amount || 0),
      description: formData.description
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Record Additional Payment</h2>
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="text-sm">
            <div><strong>Student:</strong> {payment.studentName} ({payment.studentId})</div>
            <div><strong>Expected:</strong> ₦{payment.billed.toLocaleString()}</div>
            <div><strong>Already Paid:</strong> ₦{payment.paid.toLocaleString()}</div>
            <div><strong>Outstanding:</strong> ₦{payment.outstanding.toLocaleString()}</div>
          </div>
        </div>
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <div className="text-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-gray-600">New Paid</div>
              <div className="font-semibold text-green-700">₦{Number(projectedPaid).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">New Outstanding</div>
              <div className="font-semibold text-red-700">₦{Number(projectedOutstanding).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">New Status</div>
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${projectedStatus === 'Paid' ? 'bg-green-100 text-green-800' : projectedStatus === 'Outstanding' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {projectedStatus}
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₦)</label>
            <input
              type="number"
              required
              min="1"
              max={payment.outstanding}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value || 0) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Max: ${payment.outstanding}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
