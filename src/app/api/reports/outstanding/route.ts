import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    if (!term || !session) return NextResponse.json({ error: 'term and session are required' }, { status: 400 });

    const { data, error } = await supabase.rpc('get_outstanding_by_class', {
      p_term: term,
      p_session: session
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: aging, error: aErr } = await supabase.rpc('get_outstanding_aging', {
      p_current_term: term,
      p_current_session: session
    });
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    return NextResponse.json({ outstanding: data || [], aging: aging || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








