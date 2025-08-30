import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { studentId, email } = await request.json();
    if (!studentId && !email) {
      return NextResponse.json({ error: 'Provide studentId or email' }, { status: 400 });
    }

    // Lookup student by student_id or email
    const { data: student, error: studentErr } = await supabase
      .from('school_students')
      .select('student_id, full_name, email')
      .or(
        [
          studentId ? `student_id.eq.${studentId}` : undefined,
          email ? `email.eq.${email}` : undefined,
        ]
          .filter(Boolean)
          .join(',')
      )
      .maybeSingle();

    if (studentErr) {
      return NextResponse.json({ error: studentErr.message }, { status: 500 });
    }

    // Always return success to avoid account enumeration, but only create token if student exists and has email
    const genericResponse = NextResponse.json({ success: true });

    if (!student || !student.email) {
      return genericResponse;
    }

    // Create a token valid for 30 minutes
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: insErr } = await supabase
      .from('student_password_resets')
      .insert({
        student_id: student.student_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insErr) {
      // Still do not reveal error to client; log server-side if needed
      return genericResponse;
    }

    // For now, we do not send email from server. The UI can display the link during development
    // Return a development-only token for local testing if NODE_ENV !== 'production'
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, devToken: token, student: { email: student.email } });
    }

    return genericResponse;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}









