import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // First, get the student UUID from student_id
    const { data: student, error: studentError } = await supabase
      .from('school_students')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Call the SQL RPC to get all course registration details
    const { data, error } = await supabase.rpc('get_student_registration_history', {
      p_student_uuid: student.id
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
    }

    // Transform data to match expected format
    const courses = (data || []).map((reg: any) => ({
      registration_id: reg.registration_id,
      course_code: reg.course_code,
      course_name: reg.course_name,
      class_level: reg.class_level,
      stream: reg.stream || '',
      term: reg.term,
      session: reg.session,
      status: reg.status,
      registered_at: reg.registered_at
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
