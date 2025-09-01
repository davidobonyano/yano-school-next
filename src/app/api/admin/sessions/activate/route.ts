import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Call the database function to activate the session
    const { data, error } = await supabaseService.rpc('activate_session', {
      p_session_id: sessionId
    });

    if (error) {
      console.error('Error activating session:', error);
      return NextResponse.json({ error: 'Failed to activate session' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Session activated successfully' });
  } catch (error) {
    console.error('Error in session activation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


