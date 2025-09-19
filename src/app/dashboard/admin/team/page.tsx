'use client';

import { useEffect, useState } from 'react';

type Member = {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  bio?: string;
  fun_fact?: string;
  display_order: number;
};

export default function AdminTeamPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Member>>({ display_order: 0 });
  const [message, setMessage] = useState('');

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3000); };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      setItems(data.team || []);
    } catch { showMessage('Failed to load team'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => setForm({ display_order: 0 });

  const handleSave = async () => {
    const isEdit = !!form.id;
    const res = await fetch('/api/admin/team', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { showMessage('Save failed'); return; }
    showMessage('Saved');
    resetForm();
    fetchItems();
  };

  const handleEdit = (m: Member) => setForm(m);
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { showMessage('Delete failed'); return; }
    showMessage('Deleted');
    fetchItems();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Leadership & Team</h1>
      {message && <div className="text-sm text-blue-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Name</label>
            <input className="border rounded px-2 py-1 w-full" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Role</label>
            <input className="border rounded px-2 py-1 w-full" value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Photo URL</label>
            <input className="border rounded px-2 py-1 w-full" value={form.photo_url || ''} onChange={e => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Bio</label>
            <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Fun Fact</label>
            <input className="border rounded px-2 py-1 w-full" value={form.fun_fact || ''} onChange={e => setForm({ ...form, fun_fact: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Display Order</label>
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.display_order ?? 0} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} />
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
              {items.map(m => (
                <li key={m.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-gray-600">{m.role}</div>
                    {m.photo_url && <div className="text-xs text-gray-500 break-words">{m.photo_url}</div>}
                    {m.bio && <div className="text-sm text-gray-700 mt-1">{m.bio}</div>}
                    {m.fun_fact && <div className="text-xs text-gray-500 mt-1">Fun fact: {m.fun_fact}</div>}
                    <div className="text-xs text-gray-500">Order: {m.display_order}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(m)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(m.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </li>
              ))}
              {items.length === 0 && <li className="p-3 text-gray-600">No members</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}






