'use client';

import { useEffect, useState } from 'react';

type Achievement = {
  id: string;
  event_date: string;
  title: string;
  description: string;
  display_order: number;
};

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: string; event_date: string; title: string; description: string; display_order: number }>({
    event_date: new Date().toISOString().slice(0, 10),
    title: '',
    description: '',
    display_order: 0,
  });
  const [message, setMessage] = useState('');

  const showMessage = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      setItems(data.achievements || []);
    } catch (e) {
      showMessage('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => setForm({ event_date: new Date().toISOString().slice(0, 10), title: '', description: '', display_order: 0 });

  const handleSave = async () => {
    try {
      const isEdit = !!form.id;
      const res = await fetch('/api/admin/achievements', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      showMessage('Saved');
      resetForm();
      fetchItems();
    } catch (e) {
      showMessage('Save failed');
    }
  };

  const handleEdit = (a: Achievement) => {
    setForm({ id: a.id, event_date: a.event_date, title: a.title, description: a.description, display_order: a.display_order });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/achievements?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Deleted');
      fetchItems();
    } catch (e) {
      showMessage('Delete failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Achievements</h1>
      {message && <div className="text-sm text-blue-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Date</label>
            <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded px-2 py-1 w-full min-h-[100px]" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Display Order</label>
            <input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">{form.id ? 'Update' : 'Create'}</button>
            {form.id && <button onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Existing</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <ul className="divide-y border rounded">
              {items.map(a => (
                <li key={a.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-600">{new Date(a.event_date).toLocaleDateString()}</div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-gray-700">{a.description}</div>
                    <div className="text-xs text-gray-500">Order: {a.display_order}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(a)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </li>
              ))}
              {items.length === 0 && <li className="p-3 text-gray-600">No achievements</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}






