import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Temporary bootstrap endpoint to set teacher password by email.
// In production, protect this route (admin-only) or require a token.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const { data: teacher, error: teacherErr } = await supabase
      .from('teachers')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (teacherErr) {
      return NextResponse.json({ error: teacherErr.message }, { status: 500 });
    }
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: upsertErr } = await supabase
      .from('teacher_credentials')
      .upsert({
        teacher_id: teacher.id,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'teacher_id' });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


