import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Student-initiated password change
// Expects: { studentId: string, currentPassword: string, newPassword: string }
export async function POST(request: Request) {
  try {
    const { studentId, currentPassword, newPassword } = await request.json();
    if (!studentId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Fetch current credential
    const { data: cred, error: credErr } = await supabase
      .from('student_credentials')
      .select('password_hash')
      .eq('student_id', studentId)
      .maybeSingle();

    if (credErr || !cred) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
    }

    const ok = await bcrypt.compare(currentPassword, cred.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const { error: updErr } = await supabase
      .from('student_credentials')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('student_id', studentId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


