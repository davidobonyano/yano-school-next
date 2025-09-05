'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';
import { CLASS_LEVELS } from '@/types/courses';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faRefresh, 
  faDownload, 
  faEye,
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faUsers,
  faMoneyBillWave,
  faReceipt,
  faChartBar,
  faTimes,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

type FeeItem = {
  id: string;
  class_level: string;
  stream: string | null;
  session_id: string;
  term_id: string;
  purpose: 'Tuition' | 'Exam' | 'Uniform' | 'PTA' | 'Other';
  amount: number;
  is_active: boolean;
  term_name?: string;
  session_name?: string;
};

type SummaryResponse = {
  perClass: Record<string, { expected: number; collected: number; outstanding: number }>;
  owing: Array<{ studentId: string; studentName: string; classLevel: string | null; outstanding: number }>;
};

type PaymentRecord = {
  id: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  session_id: string;
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

type Student = {
  id: string;
  student_id: string;
  full_name: string;
  class_level: string;
  stream: string | null;
};

export default function AdminPaymentsPage() {
  const { academicContext, isLoading: contextLoading } = useGlobalAcademicContext();
  const [activeTab, setActiveTab] = useState<'fees' | 'payments' | 'consolidated' | 'summary' | 'history'>('consolidated');

  // Use global academic context
  const sessionId = academicContext.sessionId;
  const termId = academicContext.termId;

  // Fees state
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  // Payment records state
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Students state for better selection
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('All');
  const [selectedStream, setSelectedStream] = useState<string>('All');

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Consolidated payment view state
  const [consolidatedData, setConsolidatedData] = useState<any>(null);
  const [loadingConsolidated, setLoadingConsolidated] = useState(false);
  const [selectedStudentForConsolidated, setSelectedStudentForConsolidated] = useState<Student | null>(null);

  // New/Update fee form
  const [feeForm, setFeeForm] = useState({
    classLevel: '',
    stream: '' as '' | 'Science' | 'Commercial' | 'Art',
    purpose: 'Tuition' as FeeItem['purpose'],
    amount: '' as string | number,
  });

  // Payment record form
  const [recordForm, setRecordForm] = useState({
    studentId: '',
    studentName: '',
    purpose: 'Tuition' as FeeItem['purpose'],
    amount: '' as string | number,
    paidOn: new Date().toISOString().split('T')[0],
    reference: '',
  });

  // Load students for selection (same pattern as teacher results)
  async function loadStudents() {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (selectedClassLevel && selectedClassLevel !== 'All') params.set('classLevel', selectedClassLevel);
      if (selectedStream && selectedStream !== 'All') params.set('stream', selectedStream);
      
      const res = await fetch(`/api/admin/students?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load students');
      setStudents(json.students || []);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoadingStudents(false);
    }
  }

  // Select student from modal
  function selectStudent(student: Student) {
    if (activeTab === 'consolidated') {
      // For consolidated view, load the payment summary
      loadConsolidatedData(student);
    } else {
      // For payment records, fill the form
      setRecordForm({
        ...recordForm,
        studentId: student.id,
        studentName: `${student.student_id} - ${student.full_name}`
      });
    }
    setShowStudentModal(false);
  }

  // Show toast notification
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }

  // Sync student charges with fee structures
  async function syncStudentCharges() {
    if (!canQuery) return;
    try {
      const res = await fetch('/api/admin/update-student-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: academicContext.sessionId,
          termId: academicContext.termId
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to sync student charges');
      
      showToast(`Successfully updated ${json.updatedCount} student charges!`, 'success');
      
      // Reload data to reflect changes
      loadSummary();
      if (activeTab === 'consolidated' && selectedStudentForConsolidated) {
        loadConsolidatedData(selectedStudentForConsolidated);
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }

  // Load consolidated payment data for selected student
  async function loadConsolidatedData(student: Student) {
    if (!canQuery) return;
    setLoadingConsolidated(true);
    try {
      const params = new URLSearchParams({
        studentId: student.id,
        sessionId: academicContext.sessionId!,
        termId: academicContext.termId!
      });
      
      const res = await fetch(`/api/admin/student-payment-summary?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load payment summary');
      
      setConsolidatedData(json);
      setSelectedStudentForConsolidated(student);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoadingConsolidated(false);
    }
  }

  // Summary
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const canQuery = useMemo(() => 
    academicContext.sessionId && academicContext.termId, 
    [academicContext.sessionId, academicContext.termId]
  );

  // Class level and stream options (same as teacher results)
  const classLevelOptions = useMemo(() => [
    'All', ...CLASS_LEVELS
  ], []);

  const streamOptions = useMemo(() => [
    'All', 'Art', 'Science', 'Commercial', 'General'
  ], []);

  // Load payment records
  async function loadPaymentRecords() {
    if (!canQuery) return;
    setLoadingPayments(true);
    try {
      const url = new URL('/api/admin/payment-records', window.location.origin);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('termId', termId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load payment records');
      setPaymentRecords(json.items || []);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function loadFees() {
    if (!canQuery) return;
    setLoadingFees(true);
    try {
      const url = new URL('/api/admin/fees', window.location.origin);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('termId', termId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load fees');
      setFees(json.items || []);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    } finally {
      setLoadingFees(false);
    }
  }

  async function upsertFee(e: React.FormEvent) {
    e.preventDefault();
    if (!canQuery) return;
    try {
      const body = {
        classLevel: feeForm.classLevel,
        stream: feeForm.stream || null,
        sessionId,
        termId,
        purpose: feeForm.purpose,
        amount: Number(feeForm.amount || 0),
        isActive: true,
      };
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save fee');
      await loadFees();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    }
  }

  async function deleteFee(item: FeeItem) {
    if (!canQuery) return;
    try {
      const url = new URL('/api/admin/fees', window.location.origin);
      url.searchParams.set('classLevel', item.class_level);
      url.searchParams.set('sessionId', item.session_id);
      url.searchParams.set('termId', item.term_id);
      url.searchParams.set('purpose', item.purpose);
      url.searchParams.set('stream', String(item.stream));
      const res = await fetch(url.toString(), { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete fee');
      await loadFees();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    }
  }

  async function loadSummary() {
    if (!canQuery) return;
    setLoadingSummary(true);
    try {
      const url = new URL('/api/admin/payments-summary', window.location.origin);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('termId', termId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json: SummaryResponse = await res.json();
      if (!res.ok) throw new Error((json as any)?.error || 'Failed to load summary');
      setSummary(json);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function createPaymentRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!canQuery) return;
    try {
      const paymentAmount = Number(recordForm.amount || 0);
      if (paymentAmount <= 0) {
        showToast('Payment amount must be greater than 0', 'error');
        return;
      }

      // Check if payment would exceed expected fee
      const params = new URLSearchParams({
        studentId: recordForm.studentId,
        sessionId: academicContext.sessionId!,
        termId: academicContext.termId!
      });
      
      const summaryRes = await fetch(`/api/admin/student-payment-summary?${params.toString()}`);
      const summaryJson = await summaryRes.json();
      
      if (summaryRes.ok && summaryJson.summary) {
        const feeSummary = summaryJson.summary.find((item: any) => item.purpose === recordForm.purpose);
        if (feeSummary && (feeSummary.paid + paymentAmount) > feeSummary.expected) {
          showToast(`Payment would exceed expected fee. Maximum allowed: ₦${(feeSummary.expected - feeSummary.paid).toLocaleString()}`, 'error');
          return;
        }
      }

      const body = {
        studentId: recordForm.studentId,
        sessionId: academicContext.sessionId,
        termId: academicContext.termId,
        purpose: recordForm.purpose,
        amount: paymentAmount,
        paidOn: recordForm.paidOn || undefined,
        reference: recordForm.reference || undefined,
      };
      const res = await fetch('/api/admin/payment-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add payment');
      
      // Show success toast
      showToast('Payment recorded successfully!', 'success');
      
      // Reset form and reload data
      setRecordForm({ studentId: '', studentName: '', purpose: 'Tuition', amount: '', paidOn: new Date().toISOString().split('T')[0], reference: '' });
      await loadSummary();
      loadPaymentRecords();
      
      // Reload consolidated data if viewing consolidated tab
      if (activeTab === 'consolidated' && selectedStudentForConsolidated) {
        loadConsolidatedData(selectedStudentForConsolidated);
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }

  useEffect(() => {
    if (canQuery && !contextLoading) {
      loadFees();
      loadSummary();
      loadPaymentRecords();
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, contextLoading]);

  // Reload students when class/stream filters change
  useEffect(() => {
    if (showStudentModal) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassLevel, selectedStream, showStudentModal]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Manage fee structures, payment records, and view financial summaries</p>
      </div>

      {/* Current Academic Context Display */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Academic Context</h2>
        {contextLoading ? (
          <div className="text-gray-500">Loading academic context...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Current Session</h3>
              <p className="text-lg font-semibold text-blue-900">{academicContext.session || 'Not set'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-1">Current Term</h3>
              <p className="text-lg font-semibold text-green-900">{academicContext.term || 'Not set'}</p>
            </div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>Note:</strong> Payment management is synchronized with the global academic context. 
          To change the session/term, use the academic context switcher in the main navigation.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'fees', label: 'Fee Structures', icon: faMoneyBillWave },
              { id: 'payments', label: 'Payment Records', icon: faReceipt },
              { id: 'consolidated', label: 'Student Payments', icon: faUsers },
              { id: 'summary', label: 'Summary & Reports', icon: faChartBar },
              { id: 'history', label: 'Payment History', icon: faEye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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

        <div className="p-6">
          {/* Fee Structures Tab */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fee Structure Management</h3>
                <div className="flex gap-2">
                  <button
                    onClick={syncStudentCharges}
                    disabled={!canQuery}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Sync Student Charges
                  </button>
                  <button
                    onClick={loadFees}
                    disabled={loadingFees || !canQuery}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRefresh} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Sync Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 mr-2" />
                  <div>
                    <h5 className="font-semibold text-yellow-800">Sync Student Charges</h5>
                    <p className="text-yellow-700 text-sm mt-1">
                      When you update fee amounts, click "Sync Student Charges" to update all existing student charges to match the new fee structure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Fee Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Add/Update Fee Structure</h4>
                <form onSubmit={upsertFee} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input
                    placeholder="Class Level (e.g., JSS1, SS2)"
                    value={feeForm.classLevel}
                    onChange={(e) => setFeeForm({ ...feeForm, classLevel: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={feeForm.stream}
                    onChange={(e) => setFeeForm({ ...feeForm, stream: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
            <option value="">Stream (optional)</option>
            <option value="Science">Science</option>
            <option value="Commercial">Commercial</option>
            <option value="Art">Art</option>
          </select>
                  <select
                    value={feeForm.purpose}
                    onChange={(e) => setFeeForm({ ...feeForm, purpose: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
            <option value="Tuition">Tuition</option>
            <option value="Exam">Exam</option>
            <option value="Uniform">Uniform</option>
            <option value="PTA">PTA</option>
            <option value="Other">Other</option>
          </select>
                  <input
                    type="number"
                    placeholder="Amount (₦)"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!canQuery}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Save Fee
                  </button>
        </form>
              </div>

              {/* Fee Structures Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadingFees ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading fees...</td>
                        </tr>
                      ) : fees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No fee structures found</td>
                        </tr>
                      ) : (
                        fees.map((fee) => (
                          <tr key={fee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.class_level}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.stream || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.purpose}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦{Number(fee.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                fee.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {fee.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => deleteFee(fee)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete fee structure"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                  </tr>
                        ))
                      )}
              </tbody>
            </table>
                </div>
              </div>
            </div>
          )}

          {/* Payment Records Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Record Management</h3>
                <button
                  onClick={loadPaymentRecords}
                  disabled={loadingPayments || !canQuery}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Refresh
                </button>
        </div>

              {/* Add Payment Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Record New Payment</h4>
                <form onSubmit={createPaymentRecord} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="relative">
                    <input
                      placeholder="Select Student"
                      value={recordForm.studentName}
                      readOnly
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentModal(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    >
                      <FontAwesomeIcon icon={faUsers} />
                    </button>
                  </div>
                  <select
                    value={recordForm.purpose}
                    onChange={(e) => setRecordForm({ ...recordForm, purpose: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
            <option value="Tuition">Tuition</option>
            <option value="Exam">Exam</option>
            <option value="Uniform">Uniform</option>
            <option value="PTA">PTA</option>
            <option value="Other">Other</option>
          </select>
                  <input
                    type="number"
                    placeholder="Amount (₦)"
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="date"
                    value={recordForm.paidOn}
                    onChange={(e) => setRecordForm({ ...recordForm, paidOn: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    placeholder="Reference (optional)"
                    value={recordForm.reference}
                    onChange={(e) => setRecordForm({ ...recordForm, reference: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!canQuery}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Record Payment
                  </button>
        </form>
              </div>

              {/* Payment Records Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadingPayments ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading payment records...</td>
                        </tr>
                      ) : paymentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No payment records found</td>
                        </tr>
                      ) : (
                        paymentRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.student_code ? `${record.student_code} - ${record.student_name || 'Unknown'}` : record.student_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.purpose}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦{Number(record.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.paid_on).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.reference || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View receipt"
                              >
                                <FontAwesomeIcon icon={faReceipt} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Consolidated Student Payments Tab */}
          {activeTab === 'consolidated' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Student Payment Summary</h3>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={faUsers} />
                  Select Student
                </button>
              </div>

              {selectedStudentForConsolidated ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900">
                      {selectedStudentForConsolidated.student_id} - {selectedStudentForConsolidated.full_name}
                    </h4>
                    <p className="text-blue-700">
                      {selectedStudentForConsolidated.class_level} {selectedStudentForConsolidated.stream ? `- ${selectedStudentForConsolidated.stream}` : ''}
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mr-2" />
                      <div>
                        <h5 className="font-semibold text-green-800">Consolidated Payment View</h5>
                        <p className="text-green-700 text-sm mt-1">
                          This table shows expected fees vs actual payments. Click "Add Payment" to record new payments directly from this view.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingConsolidated ? (
                    <div className="text-center py-8 text-gray-500">Loading payment summary...</div>
                  ) : consolidatedData ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {consolidatedData.summary.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.purpose}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₦{Number(item.expected).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₦{Number(item.paid).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₦{Number(item.balance).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                  item.status === 'Outstanding' ? 'bg-red-100 text-red-800' :
                                  item.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setRecordForm({
                                      ...recordForm,
                                      studentId: selectedStudentForConsolidated.id,
                                      studentName: `${selectedStudentForConsolidated.student_id} - ${selectedStudentForConsolidated.full_name}`,
                                      purpose: item.purpose,
                                      amount: item.balance > 0 ? item.balance : ''
                                    });
                                    setActiveTab('payments');
                                  }}
                                  disabled={item.balance <= 0}
                                  className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                  Add Payment
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No payment data available for this student.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon icon={faUsers} className="text-4xl mb-4 text-gray-300" />
                  <p className="text-lg">Select a student to view their payment summary</p>
                  <p className="text-sm mt-2">Click "Select Student" to choose a student and see their consolidated payment status</p>
                </div>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Financial Summary & Reports</h3>
                <button
                  onClick={loadSummary}
                  disabled={loadingSummary || !canQuery}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Refresh Summary
                </button>
              </div>

        {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(summary.perClass).map(([className, data]) => (
                    <div key={className} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">{className}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expected:</span>
                          <span className="text-sm font-medium text-gray-900">₦{Number(data.expected).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Collected:</span>
                          <span className="text-sm font-medium text-green-600">₦{Number(data.collected).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Outstanding:</span>
                          <span className="text-sm font-medium text-red-600">₦{Number(data.outstanding).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Collection Rate:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
              </div>
            ))}
          </div>
        )}

              {/* Outstanding Students */}
              {summary && summary.owing.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Students with Outstanding Balances</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.owing.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.studentName || student.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.classLevel || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">₦{Number(student.outstanding).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Outstanding
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600">Payment history across all sessions and terms will be displayed here.</p>
                <p className="text-sm text-gray-500 mt-2">This feature allows admins to view historical payment data and generate reports.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Selection Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Student</h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedClassLevel}
                onChange={(e) => setSelectedClassLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classLevelOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {streamOptions.map(stream => (
                  <option key={stream} value={stream}>{stream}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  // Add search functionality here if needed
                }}
              />
            </div>

            <div className="overflow-y-auto max-h-96">
              {loadingStudents ? (
                <div className="text-center py-8 text-gray-500">Loading students...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-gray-900">{student.student_id}</div>
                      <div className="text-sm text-gray-600">{student.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {student.class_level} {student.stream ? `- ${student.stream}` : ''}
                      </div>
              </div>
            ))}
          </div>
        )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <FontAwesomeIcon 
              icon={toast.type === 'success' ? faCheckCircle : faExclamationTriangle} 
              className="mr-2" 
            />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

 