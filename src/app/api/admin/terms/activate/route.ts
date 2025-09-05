import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { termId } = await request.json();

    if (!termId) {
      return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
    }

    // Call the database function to activate the term
    const { data, error } = await supabaseService.rpc('activate_term', {
      p_term_id: termId
    });

    if (error) {
      console.error('Error activating term:', error);
      return NextResponse.json({ error: 'Failed to activate term' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Term activated successfully' });
  } catch (error) {
    console.error('Error in term activation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


