import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { studentId, password, stream, classLevel } = await request.json();
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
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Optionally persist stream/classLevel updates if provided
    if ((stream && typeof stream === 'string') || (classLevel && typeof classLevel === 'string')) {
      await supabase
        .from('school_students')
        .update({
          stream: stream ?? null,
          class_level: classLevel ?? student.class_level ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);
    }

    // Upsert into student_credentials table
    const { error: credErr } = await supabase
      .from('student_credentials')
      .upsert({
        student_id: studentId,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

    if (credErr) {
      return NextResponse.json({ error: credErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


