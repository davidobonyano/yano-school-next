import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';
import { normalizeTermName } from '@/lib/term-utils';

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { searchParams } = new URL(request.url);
    const termName = searchParams.get('term');
    const sessionName = searchParams.get('session');
    if (!termName || !sessionName) {
      return NextResponse.json({ error: 'term and session are required' }, { status: 400 });
    }

    // Resolve session/term IDs
    const { data: sessionRow, error: sessErr } = await supabase
      .from('academic_sessions')
      .select('id, name')
      .eq('name', sessionName)
      .maybeSingle();
    if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
    if (!sessionRow?.id) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Try to resolve term by multiple common variants
    const preferred = normalizeTermName(termName);
    let { data: termRow, error: termErr } = await supabase
      .from('academic_terms')
      .select('id, name')
      .eq('session_id', sessionRow.id)
      .eq('name', preferred)
      .maybeSingle();
    if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

    if (!termRow?.id) {
      // Fallback: try ilike on original provided name
      const { data: t2, error: t2err } = await supabase
        .from('academic_terms')
        .select('id, name')
        .eq('session_id', sessionRow.id)
        .ilike('name', `%${termName}%`)
        .maybeSingle();
      if (t2err) return NextResponse.json({ error: t2err.message }, { status: 500 });
      termRow = t2 || null as any;
    }

    if (!termRow?.id) return NextResponse.json({ error: 'Term not found' }, { status: 404 });

    // Expected = sum student_charges; Actual = sum payment_records
    type ChargeRow = { student_id: string; amount: number };
    const { data: charges, error: chargesErr } = await supabase
      .from('student_charges')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

    const expectedRevenue = ((charges as ChargeRow[] | null) || []).reduce((sum: number, c) => sum + Number(c.amount || 0), 0);

    type PaymentRow = { student_id: string; amount: number };
    const { data: payments, error: payErr } = await supabase
      .from('payment_records')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    const actualRevenue = ((payments as PaymentRow[] | null) || []).reduce((sum: number, p) => sum + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, expectedRevenue - actualRevenue);
    const totalStudents = new Set((charges || []).map((c: any) => c.student_id)).size;
    const collectionRate = expectedRevenue > 0 ? (actualRevenue / expectedRevenue) * 100 : 0;

    return NextResponse.json({
      expectedRevenue,
      actualRevenue,
      outstanding,
      collectionRate,
      totalStudents
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


