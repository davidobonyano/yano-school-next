import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    if (!studentId || !term || !session) {
      return NextResponse.json({ error: 'studentId, term, session are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payment_ledgers')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .eq('session', session)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: balanceRows, error: balErr } = await supabase.rpc('get_student_balance', {
      p_student_id: studentId,
      p_term: term,
      p_session: session
    });
    if (balErr) return NextResponse.json({ error: balErr.message }, { status: 500 });

    return NextResponse.json({ ledger: data || [], balance: Array.isArray(balanceRows) ? balanceRows?.[0] : balanceRows });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}








