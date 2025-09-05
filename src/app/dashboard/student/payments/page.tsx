'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStudentSession } from '@/lib/student-session';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faReceipt,
  faDownload,
  faEye,
  faMoneyBillWave,
  faHistory,
  faInfoCircle,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';

type Charge = {
  id: string;
  purpose: string;
  description: string | null;
  amount: number;
  session_id: string;
  term_id: string;
  term_name?: string;
  created_at: string;
  carried_over: boolean;
};

type Payment = {
  id: string;
  purpose: string;
  amount: number;
  paid_on: string;
  session_id: string;
  term_id: string;
  term_name?: string;
  reference: string | null;
};

type LedgerRow = {
  student_id: string;
  session_id: string;
  term_id: string;
  term_name?: string;
  purpose: string;
  total_charged: number;
  total_paid: number;
  balance: number;
};

type PaymentStatus = 'paid' | 'pending' | 'outstanding';

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

export default function StudentPaymentsPage() {
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  // Academic context
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  
  // Payment data
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Get session only after mount to avoid SSR/client mismatch
  const session = mounted ? getStudentSession() : null;
  const studentId = session?.student_id || '';
  const canQuery = useMemo(() => mounted && Boolean(studentId), [mounted, studentId]);

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
        console.log('Loaded sessions:', sessions);
      }
      
      if (termsRes.ok) {
        const terms = termsData.terms || [];
        // Filter to only show standard terms (1st, 2nd, 3rd Term)
        // Also include terms that contain "1st", "2nd", or "3rd" in case of naming variations
        const standardTerms = terms.filter((term: any) => {
          const name = term.name.toLowerCase();
          return name === '1st term' || name === '2nd term' || name === '3rd term' ||
                 name.includes('1st') || name.includes('2nd') || name.includes('3rd');
        });
        setTerms(standardTerms);
        console.log('Loaded terms:', standardTerms);
        console.log('All terms from API:', terms);
      }
    } catch (e) {
      console.error('Failed to load academic context:', e);
    } finally {
      setLoadingContext(false);
    }
  }

  // Get payment status for a purpose
  function getPaymentStatus(purpose: string): PaymentStatus {
    const ledgerItem = ledger.find(l => l.purpose === purpose);
    if (!ledgerItem) return 'pending';
    
    if (ledgerItem.balance === 0) return 'paid';
    if (ledgerItem.total_paid > 0) return 'outstanding';
    return 'pending';
  }

  // Get status icon and color
  function getStatusDisplay(status: PaymentStatus) {
    switch (status) {
      case 'paid':
        return { icon: faCheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Paid' };
      case 'outstanding':
        return { icon: faExclamationTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Outstanding' };
      case 'pending':
        return { icon: faClock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Pending' };
    }
  }

  async function load() {
    if (!canQuery) return;
    setLoading(true);
    try {
      const url = new URL('/api/students/payment-history', window.location.origin);
      // Accept studentId or code; pass code for convenience if it looks non-UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(studentId)) {
        url.searchParams.set('studentId', studentId);
      } else {
        url.searchParams.set('studentCode', studentId);
      }
      if (sessionId) url.searchParams.set('sessionId', sessionId);
      if (termId) url.searchParams.set('termId', termId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load payments');
      setCharges(json.charges || []);
      setPayments(json.payments || []);
      setLedger(json.ledger || []);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    loadAcademicContext();
  }, []);

  // Auto-select current session/term when available
  useEffect(() => {
    if (sessions.length > 0 && terms.length > 0) {
      const currentSession = sessions.find(s => s.is_active);
      const currentTerm = terms.find(t => t.is_active);
      
      if (currentSession && !sessionId) {
        setSessionId(currentSession.id);
        console.log('Auto-selected session:', currentSession.name);
      }
      
      if (currentTerm && !termId) {
        setTermId(currentTerm.id);
        console.log('Auto-selected term:', currentTerm.name);
      }
    }
  }, [sessions, terms, sessionId, termId]);

  // Reset term when session changes
  useEffect(() => {
    if (sessionId && terms.length > 0) {
      const sessionTerms = terms.filter(t => t.session_id === sessionId);
      const currentTerm = sessionTerms.find(t => t.is_active);
      if (currentTerm && termId !== currentTerm.id) {
        setTermId(currentTerm.id);
      }
    }
  }, [sessionId, terms, termId]);

  useEffect(() => {
    if (mounted) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, studentId, sessionId, termId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payments</h1>
        <p className="text-gray-600">View your payment status, transaction history, and outstanding balances</p>
      </div>

      {/* Academic Context Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter by Session/Term</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session (Optional)</label>
            <select 
              value={sessionId} 
              onChange={(e) => setSessionId(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Term (Optional)</label>
            <select 
              value={termId} 
              onChange={(e) => setTermId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingContext}
            >
              <option value="">All Terms</option>
              {terms
                .filter(term => !sessionId || term.session_id === sessionId)
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'current', label: 'Current Status', icon: faMoneyBillWave },
              { id: 'history', label: 'Transaction History', icon: faHistory }
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
          {/* Current Status Tab */}
          {activeTab === 'current' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Status Overview</h3>
                <button
                  onClick={load}
                  disabled={!canQuery || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Refresh
                </button>
              </div>

              {/* Payment Status Table */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading payment status...</div>
              ) : ledger.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment information available</div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold">Payment Status Summary</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Charged</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ledger.map((item) => {
                          const status = getPaymentStatus(item.purpose);
                          const statusDisplay = getStatusDisplay(status);
                          return (
                            <tr key={`${item.session_id}-${item.term_id}-${item.purpose}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.purpose}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.term_name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦{Number(item.total_charged).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">₦{Number(item.total_paid).toLocaleString()}</td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₦{Number(item.balance).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                                  <FontAwesomeIcon icon={statusDisplay.icon} />
                                  {statusDisplay.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detailed Charges */}
              {charges.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold">Detailed Charges</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {charges.map((charge) => (
                          <tr key={charge.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{charge.purpose}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{charge.description || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{charge.term_name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦{Number(charge.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                charge.carried_over 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {charge.carried_over ? 'Previous Balance' : 'Current Term'}
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

          {/* Transaction History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <button
                  onClick={load}
                  disabled={!canQuery || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading transaction history...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment transactions found</div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.purpose}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₦{Number(payment.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(payment.paid_on).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.term_name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.reference || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Download receipt"
                              >
                                <FontAwesomeIcon icon={faReceipt} />
                              </button>
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
        </div>
      </div>
    </div>
  );
}

 