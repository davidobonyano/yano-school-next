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
import { useAcademicContext } from '@/lib/academic-context';
import { PaymentContextDisplay } from '@/components/payments/PaymentContextDisplay';
import { FeeStructureManager } from '@/components/payments/FeeStructureManager';

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

export default function PaymentRecordsPage() {
  const { currentContext } = useAcademicContext();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const paymentsLoadId = useRef(0);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // Modals
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [lookupStudentId, setLookupStudentId] = useState('');
  const [studentSummary, setStudentSummary] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Load payment data and statistics
  const loadData = useCallback(async (showLoader = true) => {
    if (!currentContext) return;
    
    const loadId = ++paymentsLoadId.current;
    if (showLoader) setIsLoading(true);

    try {
      // Load payment records and statistics in parallel
      const [paymentsResponse, statisticsResponse] = await Promise.all([
        fetch(`/api/payments?term=${encodeURIComponent(currentContext.term_name)}&session=${encodeURIComponent(currentContext.session_name)}`, { 
          cache: 'no-store' 
        }),
        fetch(`/api/payments/statistics?term=${encodeURIComponent(currentContext.term_name)}&session=${encodeURIComponent(currentContext.session_name)}`, { 
          cache: 'no-store' 
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
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentContext]);

  // Auto-refresh data when academic context changes
  useEffect(() => {
    if (currentContext) {
      loadData();
    }
  }, [currentContext, loadData]);

  // Refresh data manually
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
  };

  // Create payment records for new period
  const handleGeneratePaymentRecords = async () => {
    if (!currentContext) return;
    
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
    if (!lookupStudentId.trim() || !currentContext) return;
    
    setIsLookingUp(true);
    setStudentSummary(null);
    
    try {
      const response = await fetch('/api/students/financial-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: lookupStudentId.trim(), 
          term: currentContext.term_name, 
          session: currentContext.session_name 
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
    if (!currentContext) return;
    
    setShowAddPayment(false);
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: newPayment.studentId,
          term: currentContext.term_name,
          session: currentContext.session_name,
          amount: Number(newPayment.amount || 0),
          method: newPayment.method || 'Cash',
          description: newPayment.description || 'Payment received'
        })
      });

      if (response.ok) {
        await loadData(false); // Refresh data after payment
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
  const handleSaveEdit = async (updatedPayment: PaymentRecord) => {
    if (!currentContext) return;
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: updatedPayment.studentId,
          term: currentContext.term_name,
          session: currentContext.session_name,
          amount: Number(updatedPayment.amount || 0),
          method: 'Cash', // Default method for edits
          description: updatedPayment.description || 'Payment updated'
        })
      });

      if (response.ok) {
        setEditingPayment(null);
        await loadData(false); // Refresh data after update
      } else {
        const errorData = await response.json();
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
          <p className="text-gray-600">{currentContext?.session_name || 'Loading...'} – {currentContext?.term_name || 'Loading...'}</p>
        </div>
        <div className="flex gap-2">
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
                        href={`/api/receipts?studentId=${encodeURIComponent(payment.studentId)}&term=${encodeURIComponent(currentContext?.term_name || '')}&session=${encodeURIComponent(currentContext?.session_name || '')}`} 
                        title="Receipt" 
                        target="_blank"
                      >
                        Receipt
                      </a>
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
    method: 'Cash' as 'Cash' | 'Transfer' | 'POS' | 'Online'
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
        <h2 className="text-lg font-bold mb-4">Record New Payment</h2>
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
    amount: payment.paid,
    description: 'Additional payment'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...payment,
      amount: Number(formData.amount),
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₦)</label>
            <input
              type="number"
              required
              min="1"
              max={payment.outstanding}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
