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
    const term = searchParams.get('term');
    const studentId = searchParams.get('studentId'); // For detailed view

    if (studentId) {
      // Get detailed course registrations for a specific student
      let query = supabase
        .from('student_course_registrations')
        .select(`
          id,
          course_id,
          class_level,
          stream,
          term,
          session,
          status,
          approved_by,
          approved_at,
          registered_at,
          courses!inner(name)
        `)
        .eq('student_id', studentId)
        .order('registered_at', { ascending: false });

      // Apply filters
      if (session) {
        query = query.eq('session', session);
      }
      if (term) {
        query = query.eq('term', term);
      }

      type RegistrationRow = {
        id: string;
        course_id: string;
        class_level: string;
        stream: string | null;
        term: string;
        session: string;
        status: string;
        approved_by: string | null;
        approved_at: string | null;
        registered_at: string;
        courses?: { name?: string | null } | null;
      };
      const { data: registrations, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Transform the data
      const transformedRegistrations = ((registrations as RegistrationRow[] | null) || []).map((reg) => ({
        id: reg.id,
        course_name: reg.courses?.name || 'Unknown',
        class_level: reg.class_level,
        stream: reg.stream,
        term: reg.term,
        session: reg.session,
        status: reg.status,
        approved_by: reg.approved_by,
        approved_at: reg.approved_at,
        registered_at: reg.registered_at
      }));

      return NextResponse.json({ 
        registrations: transformedRegistrations,
        total: transformedRegistrations.length,
        filters: { session, term, studentId }
      });
    } else {
      // Get summary view - students with their registration counts
      let query = supabase
        .from('student_course_registrations')
        .select(`
          student_id,
          class_level,
          stream,
          term,
          session,
          status,
          school_students!inner(full_name)
        `)
        .order('registered_at', { ascending: false });

      // Apply filters
      if (session) {
        query = query.eq('session', session);
      }
      if (term) {
        query = query.eq('term', term);
      }

      type SummaryRow = {
        student_id: string;
        class_level: string;
        stream: string | null;
        term: string;
        session: string;
        status: 'approved' | 'pending' | 'rejected' | string;
        school_students?: { full_name?: string | null } | null;
      };
      const { data: registrations, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Group by student and count registrations
      const studentSummary = ((registrations as SummaryRow[] | null) || []).reduce((acc, reg) => {
        const key = `${reg.student_id}-${reg.session}-${reg.term}`;
        if (!acc[key]) {
          acc[key] = {
            student_id: reg.student_id,
            student_name: reg.school_students?.full_name || 'Unknown',
            class_level: reg.class_level,
            stream: reg.stream,
            term: reg.term,
            session: reg.session,
            total_registrations: 0,
            approved_registrations: 0,
            pending_registrations: 0,
            rejected_registrations: 0
          };
        }
        
        acc[key].total_registrations++;
        if (reg.status === 'approved') acc[key].approved_registrations++;
        else if (reg.status === 'pending') acc[key].pending_registrations++;
        else if (reg.status === 'rejected') acc[key].rejected_registrations++;
        
        return acc;
      }, {} as Record<string, any>);

      const transformedRegistrations = Object.values(studentSummary);

      return NextResponse.json({ 
        registrations: transformedRegistrations,
        total: transformedRegistrations.length,
        filters: { session, term }
      });
    }

  } catch (err: any) {
    console.error('Error fetching course registrations:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
