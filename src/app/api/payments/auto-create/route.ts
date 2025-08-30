import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

// Auto-create payment records for all students when session/term changes
export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { sessionId, termId, sessionName, termName } = await request.json();
    
    if (!sessionId || !termId) {
      return NextResponse.json({ error: 'sessionId and termId are required' }, { status: 400 });
    }

    // Use the database function to create payment records
    const { data: result, error } = await supabase.rpc('create_payment_records_for_period', {
      p_session_id: sessionId,
      p_term_id: termId
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const recordsCreated = result?.[0]?.records_created || 0;
    const message = result?.[0]?.message || `Created ${recordsCreated} payment records`;

    return NextResponse.json({ 
      success: true, 
      recordsCreated,
      message: `${message} for ${sessionName} - ${termName}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
