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

    // Derive graduates from transitions to avoid relying on lifecycle_status column.
    // Avoid schema relationships; fetch raw rows then enrich separately.
    let transitionsQuery = supabase
      .from('student_transitions')
      .select('student_id, action, created_at, session_id')
      .eq('action', 'Graduate')
      .order('created_at', { ascending: false });

    // Filter by session name if provided: resolve session id first
    let sessionId: string | null = null;
    if (session) {
      const { data: srow, error: serr } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', session)
        .maybeSingle();
      if (serr) return NextResponse.json({ error: serr.message }, { status: 500 });
      sessionId = srow?.id ?? null;
      if (!sessionId) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      transitionsQuery = transitionsQuery.eq('session_id', sessionId);
    }

    const { data: transitions, error } = await transitionsQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrich with student info
    const studentIds = Array.from(new Set((transitions || []).map((t: any) => t.student_id)));
    let studentsMap: Record<string, any> = {};
    if (studentIds.length) {
      const { data: students, error: sErr } = await supabase
        .from('school_students')
        .select('id, student_id, full_name, class_level, stream, is_active')
        .in('id', studentIds);
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      studentsMap = (students || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    }

    // Resolve session name if id is available
    let sessionName = session || '';
    if (!sessionName && transitions?.length && transitions[0]?.session_id) {
      const { data: srow, error: serr } = await supabase
        .from('academic_sessions')
        .select('id, name')
        .eq('id', transitions[0].session_id)
        .maybeSingle();
      if (!serr && srow?.name) sessionName = srow.name;
    }

    // Only include students who are currently inactive (still graduated)
    const filteredTransitions = (transitions || []).filter((t: any) => {
      const s = studentsMap[t.student_id];
      return s && s.is_active === false;
    });

    const studentsWithGraduationDetails = filteredTransitions.map((t: any) => ({
      student_id: studentsMap[t.student_id]?.student_id || '',
      full_name: studentsMap[t.student_id]?.full_name || 'Unknown',
      class_level: studentsMap[t.student_id]?.class_level || 'Unknown',
      stream: studentsMap[t.student_id]?.stream || null,
      graduation_date: t.created_at,
      session: sessionName || ''
    }));

    return NextResponse.json({ 
      students: studentsWithGraduationDetails,
      total: studentsWithGraduationDetails.length,
      filters: { session }
    });

  } catch (err: any) {
    console.error('Error fetching graduated students:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
