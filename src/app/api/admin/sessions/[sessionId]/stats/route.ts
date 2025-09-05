import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Call the database function to get session statistics
    const { data, error } = await supabaseService.rpc('get_session_statistics', {
      p_session_id: sessionId
    });

    if (error) {
      console.error('Error fetching session statistics:', error);
      return NextResponse.json({ error: 'Failed to fetch session statistics' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const stats = data?.[0] || {
      total_students: 0,
      total_courses: 0,
      total_fees: 0,
      active_enrollments: 0
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in session stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


