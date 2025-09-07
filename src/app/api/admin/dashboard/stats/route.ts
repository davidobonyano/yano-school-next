import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    console.log('Admin dashboard stats API called');
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const termId = searchParams.get('termId');
    
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      console.log('Admin authorization failed');
      return gate.error as Response;
    }

    console.log('Admin authorization successful, calling database function');

    // Call the database function to get admin dashboard statistics (broad totals)
    const { data, error } = await supabaseService.rpc('get_admin_dashboard_stats');

    if (error) {
      console.error('Error fetching admin dashboard stats:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch dashboard statistics',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('Database function call successful, data:', data);

    // Transform the data to match the expected format
    const stats = data?.[0] || {
      total_students: 0,
      total_teachers: 0,
      active_courses: 0,
      total_revenue: 0,
      completed_payments: 0,
      active_students: 0,
      active_courses_count: 0
    };

    // If a session/term filter is provided, compute revenue scoped to that context
    if (sessionId || termId) {
      let paymentsQuery = supabaseService
        .from('payment_records')
        .select('amount, session_id, term_id');
      if (sessionId) paymentsQuery = paymentsQuery.eq('session_id', sessionId);
      if (termId) paymentsQuery = paymentsQuery.eq('term_id', termId);
      const { data: payments, error: paymentsErr } = await paymentsQuery;
      if (!paymentsErr) {
        const filteredRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        (stats as any).total_revenue = filteredRevenue;
      } else {
        console.warn('Failed to compute filtered revenue:', paymentsErr.message);
      }
    }

    console.log('Returning stats:', stats);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in admin dashboard stats API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


