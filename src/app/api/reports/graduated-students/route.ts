import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    // Check admin authorization
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) {
      return authCheck.error!;
    }

    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session');

    // Build the query for graduated students
    let query = supabase
      .from('school_students')
      .select(`
        student_id,
        full_name,
        class_level,
        stream,
        updated_at
      `)
      .eq('lifecycle_status', 'Graduated')
      .order('updated_at', { ascending: false });

    const { data: graduatedStudents, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get student transitions to find graduation details
    const studentIds = (graduatedStudents || []).map(s => s.student_id);
    
    let transitionsQuery = supabase
      .from('student_transitions')
      .select(`
        student_transitions.student_id,
        action,
        session_id,
        term_id,
        created_at,
        academic_sessions!inner(name)
      `)
      .eq('action', 'Graduate')
      .in('student_transitions.student_id', studentIds)
      .order('created_at', { ascending: false });

    if (session) {
      transitionsQuery = transitionsQuery.eq('academic_sessions.name', session);
    }

    const { data: transitions, error: transitionsError } = await transitionsQuery;

    if (transitionsError) {
      console.error('Error fetching transitions:', transitionsError);
    }

    // Combine student data with graduation details
    const studentsWithGraduationDetails = (graduatedStudents || []).map(student => {
      const graduationTransition = (transitions || []).find(t => t.student_id === student.student_id);
      
      return {
        student_id: student.student_id,
        full_name: student.full_name,
        class_level: student.class_level,
        stream: student.stream,
        graduation_date: graduationTransition?.created_at || student.updated_at,
        session: graduationTransition?.academic_sessions?.name || 'Unknown'
      };
    });

    // Filter by session if specified
    const filteredStudents = session 
      ? studentsWithGraduationDetails.filter(s => s.session === session)
      : studentsWithGraduationDetails;

    return NextResponse.json({ 
      students: filteredStudents,
      total: filteredStudents.length,
      filters: { session }
    });

  } catch (err: any) {
    console.error('Error fetching graduated students:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
