import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { studentId, password } = await request.json();
    if (!studentId || !password) {
      return NextResponse.json({ error: 'studentId and password required' }, { status: 400 });
    }

    const { data: student, error: studentErr } = await supabase
      .from('school_students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (studentErr) {
      return NextResponse.json({ error: studentErr.message }, { status: 500 });
    }
    if (!student) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { data: cred, error: credErr } = await supabase
      .from('student_credentials')
      .select('password_hash')
      .eq('student_id', studentId)
      .maybeSingle();

    if (credErr || !cred) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, cred.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // For now, return a simple session marker; later replace with JWT/session cookie
    return NextResponse.json({ success: true, student: { student_id: student.student_id, full_name: student.full_name } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


