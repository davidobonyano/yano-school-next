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
    if (!termName || !sessionName) return NextResponse.json({ error: 'term and session are required' }, { status: 400 });

    // Resolve session/term ids
    const { data: sessionRow, error: sessErr } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', sessionName)
      .maybeSingle();
    if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
    if (!sessionRow?.id) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const preferred = normalizeTermName(termName);
    let { data: termRow, error: termErr } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('session_id', sessionRow.id)
      .eq('name', preferred)
      .maybeSingle();
    if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

    if (!termRow?.id) {
      const { data: t2, error: t2err } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('session_id', sessionRow.id)
        .ilike('name', `%${termName}%`)
        .maybeSingle();
      if (t2err) return NextResponse.json({ error: t2err.message }, { status: 500 });
      termRow = t2 || null as any;
    }

    if (!termRow?.id) return NextResponse.json({ error: 'Term not found' }, { status: 404 });

    // Expected from student_charges, paid from payment_records
    type ChargeRow = { student_id: string; amount: number };
    const { data: charges, error: chargesErr } = await supabase
      .from('student_charges')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

    type PaymentRow = { student_id: string; amount: number };
    const { data: payments, error: paymentsErr } = await supabase
      .from('payment_records')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

    // Fetch student details for display
    const studentIds = Array.from(new Set([...(charges as ChargeRow[] | null || []), ...(payments as PaymentRow[] | null || [])].map((x) => x.student_id)));
    let studentsMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      type StudentRow = { id: string; student_id: string; full_name: string; class_level: string; stream: string | null };
      const { data: students, error: studentsErr } = await supabase
        .from('school_students')
        .select('id, student_id, full_name, class_level, stream')
        .in('id', studentIds);
      if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });
      studentsMap = ((students as StudentRow[] | null) || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {} as Record<string, StudentRow>);
    }

    // Aggregate per student
    const byStudent: Record<string, { expected: number; paid: number; } > = {};
    for (const c of ((charges as ChargeRow[] | null) || [])) {
      const sid = c.student_id;
      if (!byStudent[sid]) byStudent[sid] = { expected: 0, paid: 0 };
      byStudent[sid].expected += Number(c.amount || 0);
    }
    for (const p of ((payments as PaymentRow[] | null) || [])) {
      const sid = p.student_id;
      if (!byStudent[sid]) byStudent[sid] = { expected: 0, paid: 0 };
      byStudent[sid].paid += Number(p.amount || 0);
    }

    type StudentRow = { id: string; student_id: string; full_name: string; class_level: string; stream: string | null };
    const rows = Object.entries(byStudent)
      .map(([sid, agg]) => {
        const s = (studentsMap[sid] as StudentRow | undefined) || ({} as any);
        return {
          class_level: (s.class_level as string) || 'Unknown',
          stream: (s.stream as string | null) || null,
          student_id: (s.student_id as string) || '',
          full_name: (s.full_name as string) || 'Unknown',
          outstanding: Math.max(0, agg.expected - agg.paid),
          status: (agg.expected - agg.paid) > 0 ? 'Outstanding' : 'Paid'
        };
      })
      .filter(r => r.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    // Simple aging buckets derived from outstanding remains (placeholder buckets)
    const aging = [] as any[]; // Not available without payment dates per invoice; return empty for now

    return NextResponse.json({ outstanding: rows, aging });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








