import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Get current academic context
    const { data: currentContext, error: contextErr } = await supabaseService
      .rpc('get_current_academic_context');
    
    let currentTerm = '1st Term';
    let currentSession = '2025/2026';
    
    if (contextErr) {
      console.warn('Could not get current academic context, using defaults:', contextErr.message);
    } else if (currentContext && currentContext.length > 0) {
      currentTerm = currentContext[0].term_name;
      currentSession = currentContext[0].session_name;
    }

    // Students: direct count
    const { count: totalStudents, error: studentsErr } = await supabaseService
      .from('school_students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (studentsErr) {
      console.error('Error counting students:', studentsErr);
      return NextResponse.json({ error: 'Failed to count students' }, { status: 500 });
    }

    // Active students (same as total for now)
    const activeStudents = totalStudents || 0;

    // Teachers: direct count
    const { count: teachersCount, error: teachersErr } = await supabaseService
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (teachersErr) {
      console.error('Error counting teachers:', teachersErr);
      return NextResponse.json({ error: 'Failed to count teachers' }, { status: 500 });
    }

    // Courses: count active courses
    const { count: coursesCount, error: coursesErr } = await supabaseService
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (coursesErr) {
      console.error('Error counting courses:', coursesErr);
      return NextResponse.json({ error: 'Failed to count courses' }, { status: 500 });
    }

    // Payments: try to get existing payments or return empty
    let payAgg: any[] = [];
    let pendingPayments: any[] = [];
    let completedPaymentsCount = 0;
    let totalRevenue = 0;

    try {
      const { data: existingPayments, error: payErr } = await supabaseService
        .from('payments')
        .select('status, amount')
        .eq('term', currentTerm)
        .eq('session', currentSession);
      
      if (!payErr && existingPayments) {
        payAgg = existingPayments;
        completedPaymentsCount = payAgg.filter(p => p.status === 'Paid').length;
        totalRevenue = payAgg.filter(p => p.status === 'Paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

        // Get pending payments for display
        const { data: pendingData } = await supabaseService
          .from('payments')
          .select('id, student_id, amount, description, status')
          .eq('term', currentTerm)
          .eq('session', currentSession)
          .eq('status', 'Pending')
          .limit(5);
        
        pendingPayments = pendingData || [];
      }
    } catch (paymentError) {
      console.warn('Payment system not available yet:', paymentError);
      // Continue without payments
    }

    const summary = {
      totalStudents: totalStudents || 0,
      activeStudents,
      totalTeachers: teachersCount || 0,
      totalCourses: coursesCount || 0,
      totalRevenue,
      pendingPayments: pendingPayments || [],
      completedPaymentsCount,
      activeCoursesCount: coursesCount || 0,
      currentTerm,
      currentSession,
    };

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('Error in admin summary API:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}



