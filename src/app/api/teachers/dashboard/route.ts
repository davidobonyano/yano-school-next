import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-server';
import { readTeacherSession } from '@/lib/teacher-session';

export async function GET() {
  try {
    // Get teacher session
    const session = await readTeacherSession();
    if (!session) {
      return NextResponse.json({ error: 'Teacher not authenticated' }, { status: 401 });
    }

    // Get current academic context
    const { data: currentContext, error: contextErr } = await supabase
      .rpc('get_current_academic_context');
    
    let currentTermId = null;
    let currentSessionId = null;
    
    if (contextErr) {
      console.warn('Could not get current academic context:', contextErr.message);
    } else if (currentContext && currentContext.length > 0) {
      currentTermId = currentContext[0].term_id;
      currentSessionId = currentContext[0].session_id;
    }

    // 1. Get assigned courses for this teacher (from timetable subjects)
    const { data: timetableCourses } = await supabase
      .from('timetables')
      .select('subject, class')
      .eq('teacher_name', session.name || '')
      .eq('session_id', currentSessionId)
      .eq('term_id', currentTermId);

    const assignedCourses = timetableCourses || [];
    const uniqueCourses = [...new Set(assignedCourses.map(c => c.subject).filter(Boolean))];

    // Derive base class levels taught by this teacher (e.g., "SS1 Science" -> "SS1")
    const classLevelsTaught = new Set<string>();
    (assignedCourses || []).forEach((c: any) => {
      const cls = (c.class || '').toString().trim();
      if (!cls) return;
      const base = cls.split(' ')[0];
      if (base) classLevelsTaught.add(base);
    });

    // 2. Get students with results count
    let studentsWithResultsCount = 0;
    if (currentSessionId && currentTermId) {
      const { count } = await supabase
        .from('student_results')
        .select('student_id', { count: 'exact', head: true })
        .eq('session_id', currentSessionId)
        .eq('term_id', currentTermId);

      studentsWithResultsCount = count || 0;
    }

    // 3. Get upcoming exams count from exam_sessions based on teacher's class levels (service client to avoid RLS)
    let upcomingExamsCount = 0;
    try {
      const nowIso = new Date().toISOString();
      const levels = Array.from(classLevelsTaught);
      let query = supabaseService
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('ends_at', nowIso);
      if (levels.length === 1) {
        query = query.eq('class_level', levels[0]);
      } else if (levels.length > 1) {
        query = query.in('class_level', levels);
      }
      const { count, error } = await query;
      // Fallback: if no levels detected or zero count, count all active upcoming sessions
      if ((!levels.length || (count || 0) === 0) && !error) {
        const fallback = await supabaseService
          .from('exam_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('ends_at', nowIso);
        upcomingExamsCount = fallback.count || 0;
      } else if (!error) {
        upcomingExamsCount = count || 0;
      }
    } catch (e) {
      console.warn('Upcoming exams count failed:', (e as any)?.message || e);
    }

    // 4. Get teacher's classes from timetable for today's schedule
    const { data: teacherClasses } = await supabase
      .from('timetables')
      .select('class, subject, day, period')
      .eq('teacher_name', session.name || '')
      .eq('session_id', currentSessionId)
      .eq('term_id', currentTermId);

    // Get today's schedule
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todaySchedule = (teacherClasses || []).filter(
      (item: any) => item.day?.toLowerCase() === dayName.toLowerCase()
    );

    // 5. Get announcements for teachers
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .or('audience.eq.teachers,audience.eq.all,audience_role.eq.teacher')
      .order('created_at', { ascending: false })
      .limit(5);

    // 6. Approvals summary (service client) - term/session scoped when available
    let approvedStudents = 0;
    let approvedCourses = 0;
    try {
      let approvalsQuery = supabaseService
        .from('student_course_registrations')
        .select('student_id, course_id')
        .eq('status', 'approved');
      if (currentSessionId) approvalsQuery = approvalsQuery.eq('session_id', currentSessionId);
      if (currentTermId) approvalsQuery = approvalsQuery.eq('term_id', currentTermId);
      const { data: approvedRows } = await approvalsQuery;
      if (Array.isArray(approvedRows)) {
        const studentSet = new Set<string>();
        const courseSet = new Set<string>();
        approvedRows.forEach((r: any) => {
          if (r.student_id) studentSet.add(r.student_id);
          if (r.course_id) courseSet.add(r.course_id);
        });
        approvedStudents = studentSet.size;
        approvedCourses = courseSet.size;
      }
    } catch (e) {
      console.warn('Approvals summary failed:', (e as any)?.message || e);
    }

    return NextResponse.json({
      assignedCourses: uniqueCourses.length,
      studentsWithResults: studentsWithResultsCount,
      upcomingExams: upcomingExamsCount,
      todaySchedule: todaySchedule,
      announcements: announcements || [],
      approvedStudents,
      approvedCourses
    });

  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




