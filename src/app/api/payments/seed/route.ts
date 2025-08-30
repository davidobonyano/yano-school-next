import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { term, session } = await request.json();
    if (!term || !session) return NextResponse.json({ error: 'term and session required' }, { status: 400 });
    const { data, error } = await supabase.rpc('seed_pending_payments', { p_term: term, p_session: session });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


