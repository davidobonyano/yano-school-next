"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeriod } from "@/lib/period-context";
import { getStudentSession } from "@/lib/student-session";
import Link from "next/link";

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

export default function PaymentsPage() {
  const { period } = usePeriod();
  const session = getStudentSession();
  const studentId = session?.student_id || '';

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          studentId,
          term: period.term,
          session: period.session,
        });
        const [ledgerRes, receiptsRes] = await Promise.all([
          fetch(`/api/students/ledger?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/receipts?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
        ]);
        const ledgerJson = await ledgerRes.json();
        const receiptsJson = await receiptsRes.json();
        if (!ledgerRes.ok) throw new Error(ledgerJson.error || "Failed to load ledger");
        if (!receiptsRes.ok) throw new Error(receiptsJson.error || "Failed to load receipts");
        setLedger(ledgerJson.ledger || []);
        setBalance(Number(ledgerJson.balance || 0));
        setReceipts(receiptsJson.receipts || []);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, period.term, period.session]);

  const totals = useMemo(() => {
    const billed = ledger.filter(r => r.entry_type === "Bill" || r.entry_type === "CarryForward").reduce((s, r) => s + Number(r.amount || 0), 0);
    const paid = ledger.filter(r => r.entry_type === "Payment").reduce((s, r) => s + Number(r.amount || 0), 0);
    return { billed, paid, outstanding: Math.max(balance, 0) };
  }, [ledger, balance]);

  const status = totals.outstanding > 0 ? "Outstanding" : "Paid";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-gray-600">Term: {period.term} • Session: {period.session}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
      )}

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

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Transaction History</h2>
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
    </div>
  );
}