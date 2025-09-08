'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/admin/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage('Reset email sent. Check your inbox.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Forgot Password</h1>
      <p className="text-sm text-gray-600">Enter your admin email to receive a reset link.</p>
      <form onSubmit={handleSend} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          className="w-full border rounded px-3 py-2"
          required
        />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
          {loading ? 'Sending…' : 'Send Reset Email'}
        </button>
      </form>
      {message && <div className="text-sm">{message}</div>}
    </div>
  );
}







