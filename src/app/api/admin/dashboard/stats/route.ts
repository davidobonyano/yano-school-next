import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    console.log('Admin dashboard stats API called');
    
    const gate = requireAdmin(request);
    if (!gate.ok) {
      console.log('Admin authorization failed');
      return gate.error as Response;
    }

    console.log('Admin authorization successful, calling database function');

    // Call the database function to get admin dashboard statistics
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


