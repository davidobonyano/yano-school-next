import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { studentId } = await request.json();
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('school_students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ found: false });
    }

    // Check if credentials already exist for this student
    const { data: cred } = await supabase
      .from('student_credentials')
      .select('student_id')
      .eq('student_id', data.student_id)
      .maybeSingle();

    return NextResponse.json({
      found: true,
      registered: Boolean(cred),
      student: {
        student_id: data.student_id,
        full_name: data.full_name,
        email: data.email,
        class_level: data.class_level,
        stream: data.stream,
        school_name: data.school_name,
        is_active: data.is_active,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


