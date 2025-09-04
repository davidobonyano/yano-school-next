import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const term = searchParams.get('term');
    const session = searchParams.get('session');

    if (!studentId || !term || !session) {
      return NextResponse.json({ error: 'student_id, term, session are required' }, { status: 400 });
    }

    // Fetch approved registrations joined with course details
    const { data, error } = await supabase
      .from('student_course_registrations')
      .select(`
        course_id,
        status,
        courses:course_id(id, name, code, class_level)
      `)
      .eq('status', 'approved')
      .eq('term', term)
      .eq('session', session)
      .in('student_id', (
        // Note: student_course_registrations.student_id references school_students.id (uuid),
        // so we map from the provided student_id (text) to the internal uuid.
        await supabase
          .from('school_students')
          .select('id')
          .eq('student_id', studentId)
      ).data?.map((r: any) => r.id) || []);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const courses = (data || []).map((r: any) => ({
      id: r.courses?.id || r.course_id,
      name: r.courses?.name,
      code: r.courses?.code,
      class_level: r.courses?.class_level,
    }));

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}




