'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePeriod } from '@/lib/period-context';

type LedgerRow = {
  id: string;
  entry_type: 'Bill' | 'Payment' | 'Adjustment' | 'CarryForward';
  amount: number;
  method?: string | null;
  description?: string | null;
  balance_after: number;
  created_at: string;
};

export default function StudentPaymentsDetailPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = decodeURIComponent(params.studentId);
  const { period } = usePeriod();
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ studentId, term: period.term, session: period.session });
        const res = await fetch(`/api/students/ledger?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load ledger');
        setLedger(data.ledger || []);
        setBalance(Number(data.balance || 0));
      } catch (e: any) {
        setError(e?.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, period.term, period.session]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Student Ledger</h1>
        <p className="text-gray-600">Student: {studentId} • Term: {period.term} • Session: {period.session}</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="mb-4 p-4 bg-white rounded shadow flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-2xl font-semibold text-gray-900">₦{Number(balance || 0).toLocaleString()}</div>
        </div>
      </div>

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
  );
}








