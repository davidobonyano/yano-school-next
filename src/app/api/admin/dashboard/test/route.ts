import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabaseService
      .from('school_students')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }

    // Test the admin dashboard stats function
    const { data: statsData, error: statsError } = await supabaseService.rpc('get_admin_dashboard_stats');

    if (statsError) {
      console.error('Admin dashboard stats function failed:', statsError);
      return NextResponse.json({ 
        error: 'Admin dashboard stats function failed', 
        details: statsError.message,
        function_exists: false
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      function_exists: true,
      stats: statsData?.[0] || {
        total_students: 0,
        total_teachers: 0,
        active_courses: 0,
        total_revenue: 0,
        completed_payments: 0,
        active_students: 0,
        active_courses_count: 0
      },
      raw_data: statsData
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


