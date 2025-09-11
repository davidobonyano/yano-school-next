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

    const preferred = normalizeTermName(termName);
    let { data: termRow, error: termErr } = await supabase
      .from('academic_terms')
      .select('id, name')
      .eq('session_id', sessionRow.id)
      .eq('name', preferred)
      .maybeSingle();
    if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

    if (!termRow?.id) {
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

    // Pull student charges for this session/term and group by student and carried_over
    type ChargeRow = { student_id: string; amount: number; carried_over: boolean };
    const { data: charges, error: chargesErr } = await supabase
      .from('student_charges')
      .select('student_id, amount, carried_over')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

    // Payments for the same session/term
    type PaymentRow = { student_id: string; amount: number };
    const { data: payments, error: payErr } = await supabase
      .from('payment_records')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    const studentIds = Array.from(new Set(((charges as ChargeRow[] | null) || []).map((c) => c.student_id)));
    let studentsMap: Record<string, { id: string; student_id: string; full_name: string; class_level: string; stream: string | null }> = {};
    if (studentIds.length > 0) {
      const { data: students, error: studentsErr } = await supabase
        .from('school_students')
        .select('id, student_id, full_name, class_level, stream')
        .in('id', studentIds);
      if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });
      studentsMap = ((students as any[]) || []).reduce((acc, s) => { acc[s.id as string] = s as any; return acc; }, {} as Record<string, { id: string; student_id: string; full_name: string; class_level: string; stream: string | null }>);
    }

    type Row = {
      class_level: string;
      stream: string | null;
      student_id: string; // public code
      full_name: string;
      current_fee: number;
      previous_debt: number;
      total: number;
      current_outstanding: number;
      previous_outstanding: number;
    };

    const byStudent: Record<string, Row> = {};
    for (const c of ((charges as ChargeRow[] | null) || [])) {
      const sid = c.student_id as string;
      const s = studentsMap[sid] || ({} as any);
      if (!byStudent[sid]) {
        byStudent[sid] = {
          class_level: (s.class_level as string) || 'Unknown',
          stream: (s.stream as string | null) || null,
          student_id: (s.student_id as string) || '',
          full_name: (s.full_name as string) || 'Unknown',
          current_fee: 0,
          previous_debt: 0,
          total: 0,
          current_outstanding: 0,
          previous_outstanding: 0
        };
      }
      if (c.carried_over) byStudent[sid].previous_debt += Number(c.amount || 0);
      else byStudent[sid].current_fee += Number(c.amount || 0);
    }

    // Sum payments per student
    const paidByStudent: Record<string, number> = {};
    for (const p of ((payments as PaymentRow[] | null) || [])) {
      const sid = p.student_id as string;
      paidByStudent[sid] = (paidByStudent[sid] || 0) + Number(p.amount || 0);
    }

    // Allocate payments to current first, then previous
    Object.entries(byStudent).forEach(([sid, r]) => {
      const paid = paidByStudent[sid] || 0;
      const paidToCurrent = Math.min(paid, r.current_fee);
      const paidToPrevious = Math.max(0, paid - paidToCurrent);
      r.current_outstanding = Math.max(0, r.current_fee - paidToCurrent);
      r.previous_outstanding = Math.max(0, r.previous_debt - paidToPrevious);
      r.total = r.current_fee + r.previous_debt;
    });

    const rows = Object.values(byStudent)
      .sort((a, b) => b.total - a.total);

    const totals = rows.reduce((acc, r) => {
      acc.current_fee += r.current_fee;
      acc.previous_debt += r.previous_debt;
      acc.total += r.total;
      acc.current_outstanding += r.current_outstanding;
      acc.previous_outstanding += r.previous_outstanding;
      return acc;
    }, { current_fee: 0, previous_debt: 0, total: 0, current_outstanding: 0, previous_outstanding: 0 });

    return NextResponse.json({ rows, totals });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


