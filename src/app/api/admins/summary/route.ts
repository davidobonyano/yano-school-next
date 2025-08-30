import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Period
    const { data: period, error: pe } = await supabaseService.rpc('get_app_period');
    if (pe) {
      return NextResponse.json({ error: pe.message }, { status: 500 });
    }
    const currentTerm = period?.[0]?.current_term || 'First Term';
    const currentSession = period?.[0]?.current_session || '2024/2025';

    // Students: use RPC that is security definer to bypass RLS
    const { data: classStats, error: statsErr } = await supabaseService
      .rpc('get_school_class_statistics');
    if (statsErr) {
      return NextResponse.json({ error: statsErr.message }, { status: 500 });
    }

    const totalStudents = (classStats || []).reduce((sum: number, row: any) => sum + (row?.total_students || 0), 0);
    const activeStudents = (classStats || []).reduce((sum: number, row: any) => sum + (row?.active_students || 0), 0);

    // Teachers: simple count
    const { count: teachersCount, error: teachersErr } = await supabaseService
      .from('teachers')
      .select('*', { count: 'exact', head: true });
    if (teachersErr) {
      return NextResponse.json({ error: teachersErr.message }, { status: 500 });
    }

    // Courses: count active courses
    const { count: coursesCount, error: coursesErr } = await supabaseService
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (coursesErr) {
      return NextResponse.json({ error: coursesErr.message }, { status: 500 });
    }

    // Check if payments exist for current term/session, if not seed them
    let payAgg: any[] = [];
    let pendingPayments: any[] = [];
    let completedPaymentsCount = 0;
    let totalRevenue = 0;

    const { data: existingPayments, error: payErr } = await supabaseService
      .from('payments')
      .select('status, amount')
      .eq('term', currentTerm)
      .eq('session', currentSession);
    
    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 500 });
    }

    // If no payments exist, seed them
    if (!existingPayments || existingPayments.length === 0) {
      const { data: seedResult, error: seedErr } = await supabaseService
        .rpc('seed_pending_payments', { p_term: currentTerm, p_session: currentSession });
      
      if (seedErr) {
        console.warn('Failed to seed payments:', seedErr.message);
      } else {
        // Refetch payments after seeding
        const { data: newPayments, error: refetchErr } = await supabaseService
          .from('payments')
          .select('status, amount')
          .eq('term', currentTerm)
          .eq('session', currentSession);
        
        if (!refetchErr) {
          payAgg = newPayments || [];
        }
      }
    } else {
      payAgg = existingPayments;
    }

    completedPaymentsCount = (payAgg || []).filter(p => p.status === 'Paid').length;
    totalRevenue = (payAgg || []).filter(p => p.status === 'Paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

    // Get pending payments for display
    const { data: pendingData, error: pendingErr } = await supabaseService
      .from('payments')
      .select('id, student_id, amount, description, status')
      .eq('term', currentTerm)
      .eq('session', currentSession)
      .eq('status', 'Pending')
      .limit(5);
    
    if (pendingErr) {
      return NextResponse.json({ error: pendingErr.message }, { status: 500 });
    }
    
    pendingPayments = pendingData || [];

    const summary = {
      totalStudents,
      activeStudents,
      totalTeachers: teachersCount ?? 0,
      totalCourses: coursesCount ?? 0,
      totalRevenue,
      pendingPayments: pendingPayments || [],
      completedPaymentsCount,
      activeCoursesCount: coursesCount ?? 0,
      currentTerm,
      currentSession,
    };

    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}



