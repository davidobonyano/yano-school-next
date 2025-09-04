"use client";

import { useEffect, useMemo, useState } from "react";
import { useGlobalAcademicContext } from "@/contexts/GlobalAcademicContext";
import { getStudentSession } from "@/lib/student-session";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faCalendarAlt, 
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

type LedgerRow = {
  id: string;
  entry_type: "Bill" | "Payment" | "Adjustment" | "CarryForward";
  amount: number;
  method?: string | null;
  description?: string | null;
  balance_after: number;
  created_at: string;
};

type ReceiptRow = {
  id: string;
  receipt_no: string;
  amount: number;
  method: string;
  issued_at: string;
};

type PaymentHistoryRow = {
  session: string;
  term: string;
  billed: number;
  paid: number;
  outstanding: number;
  status: 'Paid' | 'Partial' | 'Outstanding' | 'Pending';
  carry_forward?: number;
};

type OutstandingBalance = {
  session: string;
  term: string;
  amount: number;
  fee_type: string;
};

export default function PaymentsPage() {
  const { academicContext } = useGlobalAcademicContext();
  const session = getStudentSession();
  const studentId = session?.student_id || '';

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([]);
  const [summary, setSummary] = useState<{ billed_total: number; paid_total: number; outstanding_total: number; payment_status: 'Paid' | 'Outstanding' | 'Pending' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'outstanding'>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          studentId,
          term: academicContext.term,
          session: academicContext.session,
        });
        const [ledgerRes, receiptsRes, historyRes, outstandingRes, summaryRes] = await Promise.all([
          fetch(`/api/students/ledger?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/receipts?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
          fetch(`/api/students/payment-history?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
          fetch(`/api/students/outstanding-balances?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
          fetch(`/api/students/financial-summary`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, term: academicContext.term, session: academicContext.session })
          }),
        ]);
        
        const ledgerJson = await ledgerRes.json();
        const receiptsJson = await receiptsRes.json();
        const historyJson = await historyRes.json();
        const outstandingJson = await outstandingRes.json();
        const summaryJson = await summaryRes.json();
        
        if (!ledgerRes.ok) throw new Error(ledgerJson.error || "Failed to load ledger");
        if (!receiptsRes.ok) throw new Error(receiptsJson.error || "Failed to load receipts");
        if (!historyRes.ok) throw new Error(historyJson.error || "Failed to load payment history");
        if (!outstandingRes.ok) throw new Error(outstandingJson.error || "Failed to load outstanding balances");
        if (!summaryRes.ok) throw new Error(summaryJson.error || "Failed to load summary");
        
        setLedger(ledgerJson.ledger || []);
        setBalance(Number(ledgerJson.balance || 0));
        setReceipts(receiptsJson.receipts || []);
        setPaymentHistory(historyJson.history || []);
        setOutstandingBalances(outstandingJson.balances || []);
        setSummary(summaryJson.summary || null);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, academicContext.term, academicContext.session]);

  const totals = useMemo(() => {
    if (summary) {
      return {
        billed: Number(summary.billed_total || 0),
        paid: Number(summary.paid_total || 0),
        outstanding: Number(summary.outstanding_total || 0)
      };
    }
    const billed = ledger.filter(r => r.entry_type === "Bill" || r.entry_type === "CarryForward").reduce((s, r) => s + Number(r.amount || 0), 0);
    const paid = ledger.filter(r => r.entry_type === "Payment").reduce((s, r) => s + Number(r.amount || 0), 0);
    return { billed, paid, outstanding: Math.max(balance, 0) };
  }, [summary, ledger, balance]);

  const status = summary?.payment_status || (totals.outstanding > 0 ? "Outstanding" : "Paid");

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'outstanding') {
      return paymentHistory.filter(h => h.outstanding > 0);
    }
    return paymentHistory;
  }, [paymentHistory, historyFilter]);

  const totalOutstanding = useMemo(() => {
    return outstandingBalances.reduce((sum, balance) => sum + balance.amount, 0);
  }, [outstandingBalances]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-gray-600">Term: {academicContext.term} • Session: {academicContext.session}</p>
      </div>

      {/* Outstanding Balance Warning */}
      {totalOutstanding > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-semibold">Outstanding Balances from Previous Terms</h3>
              <p className="text-yellow-700">
                You have outstanding balances totaling ₦{totalOutstanding.toLocaleString()} from previous terms.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
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
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              Current Term
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Payment History
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
      )}

      {activeTab === 'current' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Current Fee</h3>
              <p className="text-2xl font-bold">₦{Number(totals.billed).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Amount Paid</h3>
              <p className="text-2xl font-bold">₦{Number(totals.paid).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Outstanding</h3>
              <p className={`text-2xl font-bold ${status === 'Paid' ? 'text-green-700' : 'text-yellow-700'}`}>₦{Number(totals.outstanding).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Status</h3>
              <span className={`px-2 py-1 text-sm font-semibold rounded ${status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{status}</span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <>
          {/* History Filter */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'outstanding')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Terms</option>
                <option value="outstanding">Outstanding Only</option>
              </select>
            </div>
          </div>
        </>
      )}

      {activeTab === 'current' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Term Transaction History</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="overflow-hidden rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.entry_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.method || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.entry_type === 'Payment' ? `-₦${Number(row.amount).toLocaleString()}` : `₦${Number(row.amount).toLocaleString()}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{Number(row.balance_after).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Payment History by Term</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="overflow-hidden rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.session}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.term}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{Number(row.billed).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{Number(row.paid).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{Number(row.outstanding).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          row.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          row.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                          row.status === 'Outstanding' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'current' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Receipts</h2>
          {receipts.length === 0 ? (
            <div className="text-gray-600">No receipts yet.</div>
          ) : (
            <div className="overflow-hidden rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.receipt_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{Number(r.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(r.issued_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link className="text-blue-600 hover:underline" href={`/api/receipts/${encodeURIComponent(r.receipt_no)}/pdf`} target="_blank">
                          Download PDF
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}