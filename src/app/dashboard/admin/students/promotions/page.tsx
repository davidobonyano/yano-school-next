'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePeriod } from '@/lib/period-context';

type Student = { student_id: string; full_name: string; class_level: string; stream: string | null };

export default function PromotionsPage() {
  const { period, setPeriod } = usePeriod();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedBills, setSeedBills] = useState(true);
  const [newTerm, setNewTerm] = useState(period.term);
  const [newSession, setNewSession] = useState(period.session);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_students')
        .select('student_id, full_name, class_level, stream')
        .eq('is_active', true)
        .order('class_level', { ascending: true })
        .order('full_name', { ascending: true });
      if (!error) setStudents((data || []) as Student[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (sid: string) => setSelected(prev => ({ ...prev, [sid]: !prev[sid] }));
  const allSelected = useMemo(() => students.length > 0 && students.every(s => selected[s.student_id]), [students, selected]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    const enable = !allSelected;
    for (const s of students) next[s.student_id] = enable;
    setSelected(next);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const ids = Object.keys(selected).filter(k => selected[k]);
      if (ids.length === 0) throw new Error('Select at least one student');
      const res = await fetch('/api/students/bulk-promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids, newTerm, newSession, seedBills })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to promote');
      setPeriod({ term: newTerm, session: newSession });
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Promotion</h1>
        <p className="text-gray-600">Current: {period.term} • {period.session}</p>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm text-gray-600 mb-1">New Term</label>
          <select className="w-full border rounded p-2" value={newTerm} onChange={e => setNewTerm(e.target.value)}>
            {['First','Second','Third'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm text-gray-600 mb-1">New Session</label>
          <input className="w-full border rounded p-2" value={newSession} onChange={e => setNewSession(e.target.value)} placeholder="2025/2026" />
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={seedBills} onChange={e => setSeedBills(e.target.checked)} />
            Seed bills for new term
          </label>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center justify-end">
          <button disabled={submitting} onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{submitting ? 'Processing...' : 'Promote Selected'}</button>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-4"><input type="checkbox" checked={!!selected[s.student_id]} onChange={() => toggle(s.student_id)} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.student_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.class_level}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.stream || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}








