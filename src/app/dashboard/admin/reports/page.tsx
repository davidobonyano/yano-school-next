'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAcademicContext } from '@/lib/academic-context';

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

export default function AdminReportsPage() {
  const { currentContext } = useAcademicContext();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => ({
    term: currentContext?.term_name || 'First Term',
    session: currentContext?.session_name || '2024/2025'
  }), [currentContext?.term_name, currentContext?.session_name]);

  useEffect(() => {
    (async () => {
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
    })();
  }, [period.term, period.session]);

  const formatNaira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-gray-600">Term: {period.term} — Session: {period.session}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="space-y-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Totals</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Students</div>
                  <div className="text-xl font-bold">{revenue?.totalStudents ?? 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Outstanding</div>
                  <div className="text-xl font-bold text-yellow-700">{formatNaira(summary?.outstanding || revenue?.outstanding || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Expected</div>
                  <div className="text-xl font-bold">{formatNaira(summary?.expected || revenue?.expectedRevenue || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Collected</div>
                  <div className="text-xl font-bold">{formatNaira(summary?.collected || revenue?.actualRevenue || 0)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Links</h2>
              <ul className="list-disc pl-5 text-blue-700">
                <li><a className="hover:underline" href="/dashboard/admin/payments/class-status">Payments by Class/Stream</a></li>
              </ul>
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
        </div>
      )}
    </div>
  );
}




