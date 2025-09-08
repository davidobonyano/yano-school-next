'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When redirected from email link, Supabase attaches an access token to the URL and updates the session internally
    // We can rely on supabase.auth.getSession() afterward
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) { setMessage('Password too short'); return; }
    if (password !== confirm) { setMessage('Passwords do not match'); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Mint legacy session cookie
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (token) {
        const res = await fetch('/api/admins/session/mint', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error || 'Failed to establish session');
        }
      }

      setMessage('Password updated. Redirecting…');
      setTimeout(() => router.push('/dashboard/admin'), 800);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Set New Password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full border rounded px-3 py-2" required />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full border rounded px-3 py-2" required />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{loading ? 'Saving…' : 'Save Password'}</button>
      </form>
      {message && <div className="text-sm">{message}</div>}
    </div>
  );
}







