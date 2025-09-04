'use client';

import { useEffect, useState } from 'react';
import { usePeriod } from '@/lib/period-context';

type Fee = {
  id: string;
  class_level_text: string;
  term: string;
  session: string;
  tuition_fee: number;
  development_levy: number;
  examination_fee: number;
  sports_fee: number;
  pta_fee: number;
  total_fee: number;
};

export default function FeesPage() {
  const { period } = usePeriod();
  const [fees, setFees] = useState<Fee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    class_level_text: '',
    tuition_fee: '',
    development_levy: '',
    examination_fee: '',
    sports_fee: '',
    pta_fee: '',
  });

  const loadFees = async () => {
    const params = new URLSearchParams({ term: period.term, session: period.session });
    const res = await fetch(`/api/fees?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) setFees((data.fees || []).map((f: any) => ({
      id: f.id,
      class_level_text: f.class_level_text,
      term: f.term,
      session: f.session,
      tuition_fee: Number(f.tuition_fee),
      development_levy: Number(f.development_levy),
      examination_fee: Number(f.examination_fee),
      sports_fee: Number(f.sports_fee),
      pta_fee: Number(f.pta_fee),
      total_fee: Number(f.total_fee),
    })));
  };

  useEffect(() => {
    loadFees();
  }, [period.term, period.session]);

  const addFee = async () => {
    const body = {
      class_level_text: form.class_level_text,
      term: period.term,
      session: period.session,
      tuition_fee: Number(form.tuition_fee || 0),
      development_levy: Number(form.development_levy || 0),
      examination_fee: Number(form.examination_fee || 0),
      sports_fee: Number(form.sports_fee || 0),
      pta_fee: Number(form.pta_fee || 0),
      total_fee: Number(form.tuition_fee || 0) + Number(form.development_levy || 0) + Number(form.examination_fee || 0) + Number(form.sports_fee || 0) + Number(form.pta_fee || 0),
    };
    const res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setIsAdding(false);
      setForm({ class_level_text: '', tuition_fee: '', development_levy: '', examination_fee: '', sports_fee: '', pta_fee: '' });
      loadFees();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-gray-600">{period.term} / {period.session}</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Fee</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dev.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sports</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fees.map(f => (
                <tr key={f.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">{f.class_level_text}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">₦{Number(f.tuition_fee ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">₦{Number(f.development_levy ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">₦{Number(f.examination_fee ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">₦{Number(f.sports_fee ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">₦{Number(f.pta_fee ?? 0).toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">₦{Number(f.total_fee ?? 0).toLocaleString('en-NG')}</td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No fee structures found for this term/session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h2 className="text-lg font-bold mb-4">Add Fee Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <input className="w-full px-3 py-2 border rounded" value={form.class_level_text} onChange={(e) => setForm({ ...form, class_level_text: e.target.value })} placeholder="e.g. JSS 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tuition</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={form.tuition_fee} onChange={(e) => setForm({ ...form, tuition_fee: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Development Levy</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={form.development_levy} onChange={(e) => setForm({ ...form, development_levy: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Examination Fee</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={form.examination_fee} onChange={(e) => setForm({ ...form, examination_fee: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sports Fee</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={form.sports_fee} onChange={(e) => setForm({ ...form, sports_fee: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PTA Fee</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={form.pta_fee} onChange={(e) => setForm({ ...form, pta_fee: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={addFee} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


