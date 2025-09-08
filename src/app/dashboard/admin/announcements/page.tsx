'use client';

import { useEffect, useMemo, useState } from 'react';
import { CLASS_LEVELS as SHARED_CLASS_LEVELS } from '@/types/courses';

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'students'|'teachers'|'admins'|'all'|'class'|'role';
  created_at: string;
  expires_at: string | null;
  audience_class_level?: string | null;
  audience_stream?: string | null;
  audience_role?: 'student'|'teacher'|'admin' | null;
  attachments?: { name: string; url: string; type?: string; size?: number }[];
};

const CLASS_LEVELS = SHARED_CLASS_LEVELS as unknown as string[];

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const emptyForm: Announcement = useMemo(() => ({
    id: '',
    title: '',
    body: '',
    audience: 'all',
    created_at: new Date().toISOString(),
    expires_at: null,
    audience_class_level: null,
    audience_stream: null,
    audience_role: null,
    attachments: []
  }), []);

  const [form, setForm] = useState<Announcement>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setItems(data.announcements || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        expires_at: form.expires_at,
        audience_class_level: form.audience === 'class' ? form.audience_class_level : null,
        audience_stream: form.audience === 'class' ? (form.audience_stream || null) : null,
        audience_role: form.audience === 'role' ? form.audience_role : null,
        attachments: form.attachments || []
      };
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing.id, ...payload } : payload;
      const res = await fetch('/api/announcements', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
      resetForm();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Failed'); return; }
    await load();
  };

  const startEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      ...a,
      audience: (a.audience as any) || 'all',
      audience_class_level: a.audience_class_level || null,
      audience_stream: a.audience_stream || null,
      audience_role: a.audience_role || null,
      // never allow null select values
    });
  };

  const renderAudienceBadge = (a: Announcement) => {
    if (a.audience === 'class') {
      const cls = a.audience_class_level || '?';
      const stream = a.audience_stream ? ` ${a.audience_stream}` : '';
      return `${cls}${stream ? ' -' + stream : ''}`;
    }
    if (a.audience === 'role') return `Role: ${a.audience_role}`;
    return a.audience;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Announcements</h1>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-medium mb-3">{editing ? 'Edit' : 'Create'} Announcement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Audience</label>
            <select className="w-full border rounded px-3 py-2" value={form.audience || 'all'} onChange={(e) => setForm(f => ({ ...f, audience: (e.target.value || 'all') as any }))}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="admins">Admins</option>
              <option value="class">Specific class</option>
              <option value="role">Specific role</option>
            </select>
          </div>
          {form.audience === 'class' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Class Level</label>
                <select className="w-full border rounded px-3 py-2" value={form.audience_class_level ?? ''} onChange={(e) => setForm(f => ({ ...f, audience_class_level: (e.target.value || null) as any }))}>
                  <option value="">Select...</option>
                  {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stream (optional)</label>
                <input className="w-full border rounded px-3 py-2" value={form.audience_stream || ''} onChange={(e) => setForm(f => ({ ...f, audience_stream: e.target.value || null }))} placeholder="Science/Commercial/Arts" />
              </div>
            </>
          )}
          {form.audience === 'role' && (
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="w-full border rounded px-3 py-2" value={form.audience_role ?? ''} onChange={(e) => setForm(f => ({ ...f, audience_role: (e.target.value || null) as any }))}>
                <option value="">Select...</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[120px]" value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry (optional)</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={form.expires_at ? form.expires_at.substring(0,16) : ''} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={save} disabled={saving || !form.title || !form.body}>
            {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
          </button>
          {editing && (
            <button className="px-4 py-2 rounded border" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">All Announcements</h2>
          <button className="text-sm underline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        <ul>
          {items.map(a => (
            <li key={a.id} className="px-4 py-3 border-b grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-5">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{a.body}</div>
              </div>
              <div className="md:col-span-3 text-sm">
                <div><span className="font-medium">Audience:</span> {renderAudienceBadge(a)}</div>
                {a.expires_at && <div className="text-orange-700">Expires: {new Date(a.expires_at).toLocaleString()}</div>}
              </div>
              <div className="md:col-span-2 text-sm text-gray-600">{new Date(a.created_at).toLocaleString()}</div>
              <div className="md:col-span-2 flex gap-2 justify-start md:justify-end">
                <button className="px-3 py-1 border rounded" onClick={() => startEdit(a)}>Edit</button>
                <button className="px-3 py-1 border rounded text-red-600" onClick={() => remove(a.id)}>Delete</button>
              </div>
            </li>
          ))}
          {items.length === 0 && !loading && (
            <li className="px-4 py-6 text-center text-gray-500">No announcements yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
