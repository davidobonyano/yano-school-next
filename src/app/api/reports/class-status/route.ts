import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    if (!term || !session) return NextResponse.json({ error: 'term and session are required' }, { status: 400 });

    // fetch students and compute balances via RPC in parallel
    const { data: students, error: sErr } = await supabase
      .from('school_students')
      .select('student_id, full_name, class_level, stream')
      .eq('is_active', true);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const results: any[] = [];
    for (const s of students || []) {
      const { data: bal, error: bErr } = await supabase.rpc('get_student_balance', {
        p_student_id: s.student_id,
        p_term: term,
        p_session: session
      });
      if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
      const outstanding = Array.isArray(bal) ? Number(bal?.[0]) : Number(bal);
      results.push({
        student_id: s.student_id,
        full_name: s.full_name,
        class_level: s.class_level,
        stream: s.stream,
        outstanding,
        status: outstanding > 0 ? 'Outstanding' : 'Paid'
      });
    }

    // group by class/stream client-side
    const grouped: Record<string, any[]> = {};
    for (const r of results) {
      const key = `${r.class_level}${r.stream ? ' - ' + r.stream : ''}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    return NextResponse.json({ groups: grouped });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








