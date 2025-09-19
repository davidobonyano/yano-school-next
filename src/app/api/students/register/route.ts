import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { studentId, password, stream, classLevel, email } = await request.json();
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

    // Optionally persist stream/classLevel/email updates if provided
    const updates: Record<string, unknown> = {};
    const isSS = typeof classLevel === 'string' && /^SS[1-3]$/i.test(classLevel.trim());
    // Normalize stream to allowed canonical values only for SS classes
    const normalizedStreamInput = typeof stream === 'string' ? stream.trim() : '';
    const canonicalStream = normalizedStreamInput
      ? (/^science$/i.test(normalizedStreamInput)
          ? 'Science'
          : (/^commercial$/i.test(normalizedStreamInput)
              ? 'Commercial'
              : (/^arts?$/i.test(normalizedStreamInput)
                  ? 'Art'
                  : undefined)))
      : undefined;
    if (isSS) {
      updates.stream = canonicalStream ?? null;
    } else {
      updates.stream = null;
    }
    if (classLevel && typeof classLevel === 'string') {
      updates.class_level = classLevel;
    }
    // Set/overwrite email if provided
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
    if (normalizedEmail) {
      updates.email = normalizedEmail;
    }
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updStudentErr } = await supabase
        .from('school_students')
        .update(updates)
        .eq('student_id', studentId);
      if (updStudentErr) {
        return NextResponse.json({ error: updStudentErr.message }, { status: 500 });
      }
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


