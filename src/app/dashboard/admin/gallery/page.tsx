'use client';

import { useEffect, useState } from 'react';

type ImageRow = {
  id: string;
  image_url: string;
  alt?: string;
  title: string;
  category: 'prefects' | 'students' | 'events' | 'school';
  description?: string;
  display_order: number;
};

const categories = ['prefects','students','events','school'] as const;

export default function AdminGalleryPage() {
  const [items, setItems] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<ImageRow>>({ display_order: 0, category: 'students' });
  const [message, setMessage] = useState('');

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3000); };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      setItems(data.images || []);
    } catch { showMessage('Failed to load gallery'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => setForm({ display_order: 0, category: 'students' });

  const handleSave = async () => {
    const isEdit = !!form.id;
    const res = await fetch('/api/admin/gallery', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { showMessage('Save failed'); return; }
    showMessage('Saved');
    resetForm();
    fetchItems();
  };

  const handleEdit = (img: ImageRow) => setForm(img);
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { showMessage('Delete failed'); return; }
    showMessage('Deleted');
    fetchItems();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Student Gallery</h1>
      {message && <div className="text-sm text-blue-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Title</label>
            <input className="border rounded px-2 py-1 w-full" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Category</label>
            <select className="border rounded px-2 py-1 w-full" value={form.category || 'students'} onChange={e => setForm({ ...form, category: e.target.value as any })}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Image URL</label>
            <input className="border rounded px-2 py-1 w-full" value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Alt</label>
            <input className="border rounded px-2 py-1 w-full" value={form.alt || ''} onChange={e => setForm({ ...form, alt: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Description</label>
            <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
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
              {items.map(img => (
                <li key={img.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{img.title}</div>
                    <div className="text-sm text-gray-600">{img.category}</div>
                    <div className="text-xs text-gray-500 break-words">{img.image_url}</div>
                    {img.description && <div className="text-sm text-gray-700 mt-1">{img.description}</div>}
                    <div className="text-xs text-gray-500">Order: {img.display_order}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(img)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(img.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </li>
              ))}
              {items.length === 0 && <li className="p-3 text-gray-600">No images</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}






