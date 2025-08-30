'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePeriod } from '@/lib/period-context';

type Row = {
  student_id: string;
  full_name: string;
  class_level: string;
  stream: string | null;
  outstanding: number;
  status: 'Outstanding' | 'Paid';
};

export default function ClassStatusPage() {
  const { period } = usePeriod();
  const [groups, setGroups] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ term: period.term, session: period.session });
        const res = await fetch(`/api/reports/class-status?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setGroups(data.groups || {});
      } catch (e: any) {
        setError(e?.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, [period.term, period.session]);

  const classKeys = useMemo(() => Object.keys(groups).sort(), [groups]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payments by Class/Stream</h1>
        <p className="text-gray-600">Term: {period.term} — Session: {period.session}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : classKeys.length === 0 ? (
        <div className="text-gray-600">No data.</div>
      ) : (
        <div className="space-y-8">
          {classKeys.map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{key}</h2>
              </div>
              <div className="overflow-hidden rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(groups[key] || []).map((r) => (
                      <tr key={r.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{Number(r.outstanding || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link className="text-blue-600 hover:underline" href={`/dashboard/admin/students/${encodeURIComponent(r.student_id)}/payments`}>
                            View Ledger
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}








