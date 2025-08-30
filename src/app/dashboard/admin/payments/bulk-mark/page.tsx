'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePeriod } from '@/lib/period-context';

type Row = { student_id: string; full_name: string; class_level: string; outstanding: number };

export default function BulkMarkPaymentsPage() {
  const { period } = usePeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'Cash'|'Transfer'|'POS'|'Online'>('Cash');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_outstanding_by_class', { p_term: period.term, p_session: period.session });
      if (!error) setRows((data || []).map((d: any) => ({ student_id: d.student_id, full_name: d.full_name, class_level: d.class_level, outstanding: Number(d.outstanding || 0) })));
      setLoading(false);
    })();
  }, [period.term, period.session]);

  const allSelected = useMemo(() => rows.length > 0 && rows.every(r => selected[r.student_id]), [rows, selected]);
  const toggleAll = () => {
    const enable = !allSelected;
    const next: Record<string, boolean> = {};
    for (const r of rows) next[r.student_id] = enable;
    setSelected(next);
  };
  const toggle = (sid: string) => setSelected(prev => ({ ...prev, [sid]: !prev[sid] }));

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const ids = Object.keys(selected).filter(k => selected[k]);
      if (ids.length === 0) throw new Error('Select at least one student');
      const res = await fetch('/api/payments/bulk-mark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids, term: period.term, session: period.session, method })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark payments');
      alert('Marked fully paid');
      // refresh list
      const { data: d2 } = await supabase.rpc('get_outstanding_by_class', { p_term: period.term, p_session: period.session });
      setRows((d2 || []).map((d: any) => ({ student_id: d.student_id, full_name: d.full_name, class_level: d.class_level, outstanding: Number(d.outstanding || 0) })));
      setSelected({});
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Mark Payments</h1>
        <p className="text-gray-600">Term: {period.term} • Session: {period.session}</p>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm text-gray-600 mb-1">Method</label>
          <select className="w-full border rounded p-2" value={method} onChange={e => setMethod(e.target.value as any)}>
            {['Cash','Transfer','POS','Online'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center justify-end md:col-span-2">
          <button disabled={submitting} onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{submitting ? 'Processing...' : 'Mark Selected Fully Paid'}</button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="overflow-hidden rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : rows.map(r => (
              <tr key={r.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-4"><input type="checkbox" checked={!!selected[r.student_id]} onChange={() => toggle(r.student_id)} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.student_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.class_level}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{r.outstanding.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}








