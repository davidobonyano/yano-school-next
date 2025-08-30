import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    if (!term || !session) return NextResponse.json({ error: 'term and session are required' }, { status: 400 });

    // Expected = sum of bills for active students in period
    const { data: bills, error: bErr } = await supabase
      .from('payment_ledgers')
      .select('amount')
      .eq('entry_type', 'Bill')
      .eq('term', term)
      .eq('session', session);
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
    const expected = (bills || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);

    // Collected = sum of payments
    const { data: pays, error: pErr } = await supabase
      .from('payment_ledgers')
      .select('amount')
      .eq('entry_type', 'Payment')
      .eq('term', term)
      .eq('session', session);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    const collected = (pays || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);

    // Outstanding = sum of positive balances across students
    const { data: students, error: sErr } = await supabase
      .from('school_students')
      .select('student_id')
      .eq('is_active', true);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
    let outstanding = 0;
    for (const s of students || []) {
      const { data: bal, error: balErr } = await supabase.rpc('get_student_balance', {
        p_student_id: s.student_id,
        p_term: term,
        p_session: session
      });
      if (balErr) return NextResponse.json({ error: balErr.message }, { status: 500 });
      const val = Array.isArray(bal) ? Number(bal?.[0]) : Number(bal);
      outstanding += Math.max(val, 0);
    }

    return NextResponse.json({ summary: { expected, collected, outstanding, term, session } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








