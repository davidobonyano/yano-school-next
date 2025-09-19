import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const runtime = 'nodejs';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const nowIso = new Date().toISOString();

    const { data: resetRow, error: findErr } = await supabase
      .from('student_password_resets')
      .select('id, student_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr || !resetRow) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (resetRow.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 });
    }

    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: upsertErr } = await supabase
      .from('student_credentials')
      .upsert({
        student_id: resetRow.student_id,
        password_hash: passwordHash,
        updated_at: nowIso,
      }, { onConflict: 'student_id' });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const { error: markErr } = await supabase
      .from('student_password_resets')
      .update({ used_at: nowIso })
      .eq('id', resetRow.id);

    if (markErr) {
      // Do not fail the password change; just return success
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}









