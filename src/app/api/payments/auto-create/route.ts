import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

// POST /api/payments/auto-create
// Body: { sessionId: string, termId: string, sessionName?: string, termName?: string }
export async function POST(request: Request) {
  try {
    const { sessionId, termId } = await request.json();
    if (!sessionId || !termId) {
      return NextResponse.json({ error: 'sessionId and termId are required' }, { status: 400 });
    }

    // Call DB function that creates/ensures payment records for all students for given period
    // Align with existing period handler which uses 'handle_period_change'
    const { data, error } = await supabaseService.rpc('handle_period_change', {
      p_session: sessionId,
      p_term: termId
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}







