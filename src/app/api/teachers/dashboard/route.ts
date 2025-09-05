import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // 1. Get assigned courses for this teacher
    // For now, we'll get courses from the teacher's timetable assignments
    const { data: timetableCourses, error: timetableError } = await supabase
      .from('timetables')
      .select('subject')
      .eq('teacher_name', session.teacherName || '')
      .eq('session_id', currentSessionId)
      .eq('term_id', currentTermId);

    const assignedCourses = timetableCourses || [];
    const uniqueCourses = [...new Set(assignedCourses.map(c => c.subject))];

    // 2. Get students with results count
    let studentsWithResultsCount = 0;
    if (currentSessionId && currentTermId) {
      const { count, error: resultsError } = await supabase
        .from('student_results')
        .select('student_id', { count: 'exact', head: true })
        .eq('session_id', currentSessionId)
        .eq('term_id', currentTermId);

      if (!resultsError) {
        studentsWithResultsCount = count || 0;
      }
    }

    // 3. Get upcoming exams (placeholder - no exams system yet)
    const upcomingExams = [];

    // 4. Get teacher's classes from timetable
    const { data: teacherClasses, error: classesError } = await supabase
      .from('timetables')
      .select('class, subject, day, period')
      .eq('teacher_name', session.teacherName || '')
      .eq('session_id', currentSessionId)
      .eq('term_id', currentTermId);

    // Get today's schedule
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todaySchedule = (teacherClasses || []).filter(
      (item: any) => item.day?.toLowerCase() === dayName.toLowerCase()
    );

    // 5. Get announcements for teachers
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .or('audience.eq.teachers,audience.eq.all,audience_role.eq.teacher')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      assignedCourses: uniqueCourses.length,
      studentsWithResults: studentsWithResultsCount,
      upcomingExams: upcomingExams.length,
      todaySchedule: todaySchedule,
      announcements: announcements || []
    });

  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




